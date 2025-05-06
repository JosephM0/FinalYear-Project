from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.models import load_model
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native app

# Load saved model
model = tf.keras.models.load_model("fruit_freshness_model.h5", compile=False)

# Label mappings
class_labels_fruit = ['Apple', 'Banana', 'Orange']
class_labels_freshness = ['Unripe', 'Fresh', 'Rotten']

# Days estimate per freshness stage
days_left_map = {
    'Unripe': 5,
    'Fresh': 3,
    'Rotten': 0
}

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Empty file name'}), 400

        file_path = os.path.join('uploads', file.filename)
        os.makedirs('uploads', exist_ok=True)
        file.save(file_path)

        img = load_img(file_path, target_size=(224, 224))
        img_array = img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        fruit_pred, freshness_pred, days_pred = model.predict(img_array)



        fruit_type = class_labels_fruit[np.argmax(fruit_pred)]
        freshness_stage = class_labels_freshness[np.argmax(freshness_pred)]
        days_until_rotten = int(days_pred[0][0])  # Convert single float to int


        os.remove(file_path)

        return jsonify({
        'fruit_type': fruit_type,
        'freshness_stage': freshness_stage,
        'days_until_rotten': days_until_rotten
        
    })


    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
