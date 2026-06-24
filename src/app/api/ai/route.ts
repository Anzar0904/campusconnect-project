import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are the Campus AI Assistant for CampusConnect. Keep answers clear, engaging, and format them nicely in Markdown.`

export async function POST(req: Request) {
  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const q = query.toLowerCase().trim()

    // High quality local response engine for common General AI query examples
    if (q.includes('dbms normalization') || q.includes('database normalization') || q.includes('normalization')) {
      return NextResponse.json({
        response: `### DBMS Normalization
DBMS Normalization is the systematic process of organizing data in a database to avoid data redundancy and maintain data integrity. It involves dividing a database into two or more tables and defining relationships between them.

Here is a summary of the normal forms:
1. **First Normal Form (1NF):** Each table cell should contain only single (atomic) values. Eliminate repeating groups in individual tables.
2. **Second Normal Form (2NF):** Meet all requirements of 1NF. Remove subset data that applies to multiple rows of a table and place them in separate tables. There must be no partial dependency of any column on the primary key.
3. **Third Normal Form (3NF):** Meet all requirements of 2NF. Remove columns that do not depend on the primary key (no transitive functional dependencies).
4. **Boyce-Codd Normal Form (BCNF):** A stronger version of 3NF. For any dependency A -> B, A must be a super key.

#### Normalization Summary Table:
| Normal Form | Rule | Key Objective |
| :--- | :--- | :--- |
| **1NF** | Atomic values, unique column names | Eliminate duplicate columns |
| **2NF** | Meet 1NF, no partial dependency | Separate table for subset data |
| **3NF** | Meet 2NF, no transitive dependency | Eliminate columns not dependent on key |
| **BCNF** | For A -> B, A must be Super Key | Resolve anomalies in multi-valued keys |`
      })
    }

    if (q.includes('create a resume') || q.includes('create resume') || q.includes('resume template') || q.includes('resume')) {
      return NextResponse.json({
        response: `### Premium Markdown Resume Template
Here is a professional resume template structured in Markdown. You can copy and customize this to build your portfolio.

\`\`\`markdown
# [YOUR NAME]
📍 Greater Noida, UP | ✉️ email@iilm.edu | 📞 +91-XXXX-XXXXXX | 🔗 github.com/username

## EDUCATION
*   **IILM University**, B.Tech in Computer Science & Engineering (2023 - 2027)
    *   *CGPA:* 8.9/10.0
*   **High School**, CBSE Board (Graduated 2023)
    *   *Percentage:* 94.5%

## TECHNICAL SKILLS
*   **Languages:** JavaScript (ES6+), TypeScript, SQL (PostgreSQL), HTML5, CSS3
*   **Frameworks & Libraries:** React, Next.js, Node.js, Express, TailwindCSS
*   **Tools & Databases:** Supabase, Git/GitHub, VS Code, Postman, Jest

## PROJECTS
### CampusConnect (React, Next.js, Supabase)
*   Developed a campus social network enabling student communities, notes exchange, and careers hub.
*   Implemented Row-Level Security (RLS) policies on Supabase tables to secure student data.
*   Created a real-time chat application with message tracking.

## EXPERIENCES
### Frontend Web Developer Intern | TechCorp (Summer 2025)
*   Collaborated with backend engineers to integrate RESTful API endpoints.
*   Built responsive client interfaces using Next.js and TailwindCSS, improving load speed by 25%.
\`\`\``
      })
    }

    if (q.includes('machine learning') || q.includes('explain ml') || q.includes('explain machine learning')) {
      return NextResponse.json({
        response: `### Understanding Machine Learning
Machine Learning (ML) is a branch of artificial intelligence (AI) focused on building applications that learn from data and improve their accuracy over time without being explicitly programmed.

#### Three Main Categories of ML:
1. **Supervised Learning:**
   *   The algorithm is trained on labeled training data (input-output pairs).
   *   *Common Algorithms:* Linear Regression, Support Vector Machines (SVM), Decision Trees, Random Forest.
   *   *Examples:* Spam detection, house price prediction.
2. **Unsupervised Learning:**
   *   The algorithm is given unlabeled data and must find patterns or structures on its own.
   *   *Common Algorithms:* K-Means Clustering, Hierarchical Clustering, Principal Component Analysis (PCA).
   *   *Examples:* Customer segmentation, anomaly detection.
3. **Reinforcement Learning:**
   *   The algorithm learns by interacting with an environment, receiving rewards for good behavior and penalties for bad.
   *   *Common Algorithms:* Q-Learning, Deep Q-Networks (DQN).
   *   *Examples:* Autonomous driving, game playing (AlphaGo).

#### Key Workflow Steps:
- **Data Collection:** Gather representative samples.
- **Data Preprocessing:** Clean, normalize, and handle missing values.
- **Model Training:** Fit the algorithm on training data.
- **Model Evaluation:** Check accuracy on a test split.`
      })
    }

    // External AI API queries are completely disabled for privacy and local-only compliance.
    // Fallback to local default response engine below.

    // Default Fallback Response
    return NextResponse.json({
      response: `### General AI Assistant
Thank you for your question. As your **Campus AI Assistant**, I am here to help.

I can assist you with:
1. **Campus Connect Queries:** Ask me about campus events, active internships, placement drives, communities, notes, or your own account stats.
2. **General Academic Topics:** For example, ask me to 'Explain DBMS normalization' or 'Explain machine learning'.
3. **Career Assistance:** For example, ask me to 'Create a resume'.

For queries related to CampusConnect, please use the following commands directly to get real-time database results:
* *Show upcoming events*
* *Show active internships*
* *Show placement drives*
* *Show my communities*
* *Show my study groups*
* *Show marketplace listings*
* *Show recent notes*
* *Show past papers*`
    })
  } catch (error: any) {
    console.error('API AI route error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
