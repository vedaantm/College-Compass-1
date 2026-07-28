from flask import Flask, request, jsonify, render_template
import ollama
import os

app = Flask(__name__)  # Flask automatically looks for 'templates/' in the same directory

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/generate_sop', methods=['POST'])
def generate_sop():
    data = request.json
    print("🚀 SOP Generation Started...")  # Terminal Indicator

    sop_prompt = f"""
    You are a professional SOP writer. Your task is to generate a **formal, well-structured, and compelling Statement of Purpose (SOP)** for a student applying to **{data['university']}** for the **{data['course']}** program.

    ### **Instructions:**
    - Begin the response with **"SOP for {data['university']}:"** and remove anything before it.
    - The SOP must be **well-structured** with sections: **Introduction, Background, Experience, Goals, and Conclusion**.
    - Write in the perspective of a student who aspires to take up the **{data['course']}** at **{data['university']}** and who is studying at **{data['currentUniversity']}, reflecting their genuine academic and professional interests.
    - In the **Introduction**, do **NOT** state that the student is pursuing a career in the field. Instead, focus on why the student is interested in the **{data['course']}** at **{data['university']}** and how this specific program aligns with their aspirations.
    - Ensure the tone is dense, academic, and reflective, presenting a well-thought-out motivation and clear articulation of how their background and goals fit with the chosen program.
    - Provide more depth and complexity in the writing to make the SOP sound professional, detailed, and substantial, highlighting key experiences, skills, and academic achievements that demonstrate the student’s readiness for the program.
    - Do **NOT** include any extra thoughts, reasoning, or explanations outside the SOP.
    - End the SOP with **"*****"** and remove anything after it.

    ### **Student Details:**
    - **Current University:** {data['currentUniversity']}
    - **Target University:** {data['university']}
    - **Course Applied:** {data['course']}
    - **Background:** {data['background']}
    - **Experience:** {data['experience']}
    - **Goals:** {data['goals']}
    - **GPA:** {data['GPA']}
    - **GRE Score:** {data['GRE']}
    - **Publications:** {data['Publications']}
    - **Faculty of Interest:** {data['Faculty']}

    ### **Expected Output Format:**
    1. **Introduction:** The introduction should reflect the student's strong motivation to pursue the **{data['course']}** at **{data['university']}**, without mentioning a career path. Focus on how this program perfectly matches the student’s academic interests, aspirations, and future goals. 
    2. **Background:** Provide a detailed background of the student’s academic journey by refering to **{data['background']}** and also include **{data['currentUniversity']}**, showcasing their achievements and explaining how their previous education and experiences have prepared them for this program. Include key projects, research, or courses that have contributed to their interest in **{data['course']}**.
    3. **Experience:** Highlight specific internships, jobs, or projects that align with the program’s focus. Describe the student’s hands-on experience in data analysis, management, or any other relevant fields, showing how their practical knowledge makes them a valuable candidate for the program.
    4. **Goals:** Clearly outline the student's academic and professional goals, both short-term and long-term. Specify how **{data['university']}** and the **{data['course']}** will play a key role in achieving these goals, and describe how the student intends to leverage the resources and opportunities offered by the program to make meaningful contributions in the field.
    5. **Conclusion:** End with a powerful conclusion that reiterates the student’s readiness to contribute to the **{data['course']}** at **{data['university']}**. Highlight how the curriculum, faculty, and overall environment are aligned with the student's academic vision, and express a strong enthusiasm for the opportunity to be part of the program.

    *****
    """

    response = ollama.chat(model="deepseek-r1:1.5b", messages=[{"role": "user", "content": sop_prompt}])
    return jsonify({'sop': response["message"]["content"]})

@app.route('/buffer')
def buffer():
    return render_template('buffer.html')

@app.route('/sop')
def sop_page():
    return render_template('sop.html')


if __name__ == '__main__':
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    print(f"📂 Templates Found: {os.listdir(templates_dir)}")  # Debugging line to check templates
    app.run(debug=True, port=5001)
