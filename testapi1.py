import cv2
import base64
import requests
import threading
import time
from inference_sdk import InferenceHTTPClient

# Initialize the Roboflow API client
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="xWtR6dWI7x0jD81IumON"
)

# Start webcam capture
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)  # Reduce resolution
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

latest_frame = None
results = []

def process_frame():
    global latest_frame, results
    while True:
        if latest_frame is None:
            time.sleep(0.05)
            continue

        # Encode frame to JPEG (lower quality for speed)
        _, buffer = cv2.imencode('.jpg', latest_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
        base64_image = base64.b64encode(buffer).decode("utf-8")

        # Send frame to Roboflow API
        try:
            result = CLIENT.infer(base64_image, model_id="lionfish-qs3tq/49")
            results = result.get("predictions", [])
        except requests.exceptions.RequestException as e:
            print(f"API error: {e}")
        
        time.sleep(0.2)  # Reduce API request frequency

# Start processing thread
thread = threading.Thread(target=process_frame, daemon=True)
thread.start()

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to capture frame")
        break

    latest_frame = frame.copy()  # Store latest frame

    # Draw bounding boxes if results exist
    if results:
        highest_confidence = max(pred["confidence"] for pred in results)
        print(f"Confidence: {highest_confidence * 100:.2f}%")
        for pred in results:
            x, y, width, height = pred["x"], pred["y"], pred["width"], pred["height"]
            confidence = pred["confidence"]

            x1, y1 = int(x - width / 2), int(y - height / 2)
            x2, y2 = int(x + width / 2), int(y + height / 2)

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{confidence*100:.2f}%", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    else:
        print("No lionfish detected")
    cv2.imshow("Lionfish Detection", frame)


    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

