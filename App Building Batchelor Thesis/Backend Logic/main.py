from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()


# This allows your browser extension to communicate with this local server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the format of the data we expect from the extension
class PolicyData(BaseModel):
    text: str

# Create the endpoint that the extension will send data to
@app.post("/analyze")
async def analyze_policy(data: PolicyData):
    # 1. Grab the text sent from the extension
    policy_text = data.text
    
    # 2. Basic analysis (just calculating the length for this test)
    text_length = len(policy_text)
    
    # Dummy logic: If the policy is super long, give it a lower "score"
    dummy_score = 5 if text_length > 5000 else 9
    
    # 3. Send a JSON response back to the extension
    return {
        "status": "success",
        "received_length": text_length,
        "score": dummy_score,
        "flags": ["Just a test flag!"]
    }