# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import json
from flask import Flask, render_template, request
from backend.create_recaptcha_assessment import create_assessment
from google.cloud.recaptchaenterprise_v1 import Assessment

app = Flask(__name__)

context = {
    "project_id": os.environ["GOOGLE_CLOUD_PROJECT"],
    "site_key": os.environ["SITE_KEY"],
}

@app.route("/")
def home():
    return render_template("home.html", context=context)

@app.route("/verify", methods=["POST"])
def verify():
    try:
        data = json.loads(request.data)
        token = data.get("token")
        action = data.get("action", "home")

        assessment = create_assessment(
            context["project_id"],
            context["site_key"],
            token,
            action
        )

        # Convert the assessment object to a dictionary
        assessment_dict = Assessment.to_dict(assessment)
        
        # Extract metrics for the plaintext header
        score = assessment.risk_analysis.score
        verified_bot = getattr(assessment.risk_analysis, 'verified_bot', False)
        blocked = score < 0.3
        
        # Construct plaintext response with headers followed by raw JSON
        response_text = f"blocked={str(blocked).lower()}\n"
        response_text += f"verified_bot={str(verified_bot).lower()}\n\n"
        response_text += json.dumps(assessment_dict, indent=2)

        return response_text, 200, {'Content-Type': 'text/plain'}
    except Exception as e:
        return str(e), 500, {'Content-Type': 'text/plain'}

if __name__ == "__main__":
    app.run(port=8080, debug=True)
