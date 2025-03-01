from inference_sdk import InferenceHTTPClient

CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="xWtR6dWI7x0jD81IumON"
)

result = CLIENT.infer(your_image.jpg, model_id="lionfish-qs3tq/49")