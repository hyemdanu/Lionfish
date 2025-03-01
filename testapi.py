import cv2
import base64
import requests
from inference_sdk import InferenceHTTPClient

# Initialize the Roboflow API client
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="xWtR6dWI7x0jD81IumON"
)

# Start webcam capture
cap = cv2.VideoCapture(0)  # 0 is the default webcam

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to capture frame")
        break

    # Encode frame to JPEG format
    _, buffer = cv2.imencode('.jpg', frame)
    base64_image = base64.b64encode(buffer).decode("utf-8")

    # Send frame to Roboflow API
    try:
        result = CLIENT.infer(base64_image, model_id="lionfish-qs3tq/49")
        predictions = result.get("predictions", [])

        # Extract confidence scores (if any detections are found)
        if predictions:
            highest_confidence = max(pred["confidence"] for pred in predictions)
            print(f"Confidence: {highest_confidence * 100:.2f}%")

            # Draw bounding boxes on the frame
            for pred in predictions:
                x, y, width, height = pred["x"], pred["y"], pred["width"], pred["height"]
                confidence = pred["confidence"]

                # Convert normalized coordinates to pixels
                x1, y1 = int(x - width / 2), int(y - height / 2)
                x2, y2 = int(x + width / 2), int(y + height / 2)

                # Draw bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"{confidence*100:.2f}%", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        else:
            print("No lionfish detected")

    except requests.exceptions.RequestException as e:
        print(f"Error communicating with API: {e}")

    # Display frame
    cv2.imshow("lionfish Detection", frame)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()
