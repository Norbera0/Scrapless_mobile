# Scrapless: Product Requirements Document (PRD)

## 1. Overview

*   **Product Name:** Scrapless
*   **Mission:** To empower Filipino households to significantly reduce food waste, save money, and lessen their environmental impact through intelligent, data-driven tools.
*   **Vision:** To close the loop from consumption to waste, creating a smart, sustainable lifestyle platform that makes eco-conscious living effortless and financially rewarding.
*   **Problem Statement:** In the Philippines, a significant portion of household income is spent on food, yet a substantial amount ends up as waste due to spoilage, over-purchasing, and poor inventory management. This results in direct financial loss for families and contributes to environmental degradation.
*   **Solution:** Scrapless is a mobile-first web application that provides users with AI-powered tools to track their pantry, log waste, gain insights into their consumption habits, and receive actionable recommendations to prevent waste before it happens.

## 2. Target Audience

*   **Primary:** Budget-conscious household managers in urban and suburban areas of the Philippines (e.g., parents, young professionals, heads of household) who are responsible for grocery shopping and meal preparation. They are digitally savvy and looking for practical ways to manage their expenses.
*   **Secondary:** Environmentally-conscious millennials and Gen Z individuals who are motivated by sustainability and want to take concrete steps to reduce their carbon footprint.

## 3. Core Features & Functionality

| Feature ID | Feature Name          | Description                                                                                                                                                                                                  | User Goal / Value                                                                                                        |
| :--------- | :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| **F-01**   | **Smart Pantry**      | A digital inventory of the user's food items. Users can add items via camera (receipt/item scan), voice, or text. The system auto-suggests expiration dates and categorizes items.                              | "I want to know what I have at a glance so I don't buy duplicates or forget about items."                                |
| **F-02**   | **Intelligent Waste Log** | Users can quickly log discarded food using their camera, voice, or text. The AI identifies items and estimates their financial and environmental (CO₂e) impact. Users must specify a reason for the waste. | "I need a fast way to track what I throw away, so I can see where my money is going."                                    |
| **F-03**   | **AI Insights Engine**    | (Formerly Kitchen Coach) Proactively analyzes user data (pantry, waste, savings) to deliver personalized, narrative-driven insights about their core waste habits (e.g., "The Weekend Impulse Buyer").         | "I want to understand the *why* behind my waste, not just the *what*."                                                   |
| **F-04**   | **Actionable Solutions**  | For each insight, the AI provides a set of tailored, actionable solutions with varying difficulty levels and estimated impact, encouraging users to commit to a plan.                                         | "Tell me exactly what I can do to fix my bad habits."                                                                    |
| **F-05**   | **Cook & Shop Hub**       | Provides recipe suggestions based on pantry items nearing expiration. Generates a smart shopping list based on pantry depletion, consumption history, and waste patterns to prevent over-buying.             | "Help me use what I have and buy only what I need."                                                                      |
| **F-06**   | **Impact Dashboard (Analytics)**  | Visualizes key metrics: waste trends over time (vs. savings), waste breakdown by food category, and top reasons for waste.                                                                         | "Show me my progress and where my biggest problem areas are."                                                            |
| **F-07**   | **Virtual Savings & Rewards** | Users earn "virtual savings" for positive actions (e.g., using an item before expiry). These savings can be tracked and (in the future) transferred. Users also earn "Green Points" for gamification. | "I want to see the tangible financial benefit of my efforts and be rewarded for good habits."                            |

## 4. User Flow

### 4.1. Onboarding & First-Time Use

1.  **Sign Up:** User creates an account with Name, Email, and Password.
2.  **Welcome:** Brief introduction to the app's mission.
3.  **Action:** User is prompted to add their first items to the **Smart Pantry** (`F-01`).
4.  **Feedback:** The dashboard provides an initial state, encouraging the user to log waste to unlock insights.

### 4.2. Core Loop: The "Track-Understand-Act" Cycle

  <!-- Placeholder for a flowchart diagram -->

1.  **Track (Input):**
    *   User adds new groceries to the **Pantry** (`F-01`).
    *   When food is discarded, user opens the **Waste Log** (`F-02`) and logs the items.
2.  **Understand (Analysis):**
    *   User visits the **Analytics** page (`F-06`) to see their weekly trends and waste breakdown.
    *   User receives a notification or visits the **AI Insights** page (`F-03`) to see a new analysis of their habits.
3.  **Act (Output):**
    *   Based on pantry items, user browses the **Cook & Shop Hub** (`F-05`) for recipes.
    *   Based on AI insights, user commits to an **Actionable Solution** (`F-04`).
    *   User generates a **Smart Shopping List** (`F-05`) before going to the store.
4.  **Reward:**
    *   User's **Virtual Savings** (`F-07`) increase as they act on recommendations.
    *   The cycle repeats, with new data feeding smarter insights.

## 5. Page Content & Structure

*   **/dashboard (Home):**
    *   **Content:** At-a-glance summary of key stats (Pantry health, weekly waste vs. savings), quick action buttons ("Add to Pantry", "Log Waste"), and the main AI Insight card. Serves as the user's mission control.
*   **/pantry (My Pantry):**
    *   **Content:** A card-based view of all "live" items, searchable and filterable. Displays item name, quantity, and freshness status. Each card is clickable for details. Includes a "Waste Bin" tab to view recent waste history.
*   **/add-to-pantry:**
    *   **Content:** A multi-modal input screen (Camera, Voice, Text) for adding new grocery items.
*   **/analytics (Analytics):**
    *   **Content:** In-depth charts and visualizations. Includes a trend line of waste vs. savings, a breakdown of waste by food category, and a chart showing the top reasons for waste.
*   **/log-waste:**
    *   **Content:** A multi-modal input screen for logging waste. The primary entry point for waste data.
*   **/ai-insights (AI Insights):**
    *   **Content:** The main page for the AI analysis. Presents the latest insight "story" and a list of actionable solutions the user can adopt.
*   **/cook-shop (Cook & Shop):**
    *   **Content:** Two main sections: AI-suggested recipes based on expiring pantry items, and the smart shopping list generator and viewer.
*   **/my-savings:**
    *   **Content:** A financial-focused dashboard showing total virtual savings, the amount available to "transfer," and a history of all savings events.
*   **/rewards:**
    *   **Content:** A dashboard for "Green Points," showing total points earned and a history of point-generating activities. Includes mock integration for converting points.
*   **/profile:**
    *   **Content:** User account details, settings (e.g., savings goals), and links to saved items/recipes.

## 6. Key Metrics & Success Criteria

### 6.1. North Star Metric

*   **Weekly Waste Reduction (%):** The average week-over-week percentage decrease in the monetary value of food waste per active user. This directly measures our core mission.

### 6.2. Key Performance Indicators (KPIs)

*   **User Engagement & Retention:**
    *   DAU/MAU Ratio
    *   Waste Log Frequency (Avg. logs per user per week)
    *   Pantry Interaction Rate (% of users who add to pantry weekly)
*   **Feature Adoption:**
    *   % of users who generate a smart shopping list.
    *   % of users who commit to an AI-suggested solution.
    *   % of users who cook a suggested recipe.
*   **Impact Metrics:**
    *   Total monetary value of waste logged (and hopefully, reduced over time).
    *   Total virtual savings generated per user.
    *   Total CO₂e emissions tracked as avoided.

## 7. Future Vision & Potential Extensions

*   **Grocery Integration:** Full API integration with partners like GrabMart for seamless "Smart Auto-Buy" execution.
*   **Fintech Integration:** Real integration with BPI APIs to allow users to transfer virtual savings to a real #MySaveUp account.
*   **Community Features:** Social challenges, leaderboards for waste reduction, and sharing of user-created recipes or waste-prevention tips.
*   **Advanced AI:** Predictive analysis to forecast a user's "at-risk" items for the upcoming week.
