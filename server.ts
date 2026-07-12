// Standup_Summarizer Backend Server
import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Define local data store path (use /tmp in production/Vercel to avoid read-only filesystem errors)
const DATA_FILE = process.env.NODE_ENV === "production" || process.env.VERCEL
  ? path.join("/tmp", "standup_data_store.json")
  : path.join(process.cwd(), "standup_data_store.json");

// Define team members as in the architecture diagram
const TEAM_MEMBERS = [
  { id: "kunal", name: "Kunal", avatar: "👨‍💻", initialCount: 10 },
  { id: "jamuna", name: "Jamuna", avatar: "👩‍💻", initialCount: 7 },
  { id: "pushpak", name: "Pushpak", avatar: "🧔", initialCount: 17 },
  { id: "vaibhali", name: "Vaibhali", avatar: "👩‍🎨", initialCount: 20 },
  { id: "adarsh", name: "Adarsh", avatar: "👨‍💼", initialCount: 6 },
  { id: "usha", name: "Usha", avatar: "👩‍🔬", initialCount: 15 },
  { id: "naga", name: "Naga", avatar: "🧓", initialCount: 11 },
];

// Use GOOGLE_API_KEY, fallback to GEMINI_API_KEY
const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("Missing API key: Please set GOOGLE_API_KEY or GEMINI_API_KEY.");
  throw new Error("Missing API key: Please set GOOGLE_API_KEY or GEMINI_API_KEY.");
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to seed initial store state if not exists
function getOrInitializeStore() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.error("Error reading standup data file, re-initializing", e);
    }
  }

  // Load the initial messages from src/data/messagePool.ts or define them directly here
  // To avoid any importing or file resolving issues during esbuild bundle time, we declare
  // the initial messages directly in our state seed.
  const initialMessages = [
    // --- Kunal (10) ---
    { id: "k-1", sender: "Kunal", text: "COMPLETED the initial database schema migration for the client dashboard in local dev.", timestamp: "8:45 AM", keyword: "Completed" },
    { id: "k-2", sender: "Kunal", text: "IN PROGRESS with setting up the Express API controllers for fetching real-time alerts.", timestamp: "9:02 AM", keyword: "IN PROGRESS" },
    { id: "k-3", sender: "Kunal", text: "BLOCKER: Supabase credentials from the dev lead are currently throwing an invalid handshake error.", timestamp: "9:15 AM", keyword: "BLOCKER" },
    { id: "k-4", sender: "Kunal", text: "TO BE DONE: I need to write integration test cases for the login proxy server this afternoon.", timestamp: "10:00 AM", keyword: "TO BE DONE" },
    { id: "k-5", sender: "Kunal", text: "COMPLETED fixing the CORS warning on the dev server by configuring credentials headers.", timestamp: "11:20 AM", keyword: "Completed" },
    { id: "k-6", sender: "Kunal", text: "IN PROGRESS reading the new API specifications to map request payloads for Vikram's summary generator.", timestamp: "11:45 AM", keyword: "IN PROGRESS" },
    { id: "k-7", sender: "Kunal", text: "BLOCKER: Running out of memory in Docker containers on high-intensity batch runs.", timestamp: "1:15 PM", keyword: "BLOCKER" },
    { id: "k-8", sender: "Kunal", text: "TO BE DONE: Schedule the DB backup cron jobs. This will be my priority once auth is completely solved.", timestamp: "2:30 PM", keyword: "TO BE DONE" },
    { id: "k-9", sender: "Kunal", text: "COMPLETED the SSL certificate rotation for our development hostname.", timestamp: "3:45 PM", keyword: "Completed" },
    { id: "k-10", sender: "Kunal", text: "IN PROGRESS compiling unit tests for postgres helper classes.", timestamp: "4:50 PM", keyword: "IN PROGRESS" },

    // --- Jamuna (7) ---
    { id: "j-1", sender: "Jamuna", text: "COMPLETED the wireframes and visual UI design for the team dashboard analytics view.", timestamp: "8:50 AM", keyword: "Completed" },
    { id: "j-2", sender: "Jamuna", text: "IN PROGRESS styling the ticket history log card components with responsive tailwind columns.", timestamp: "10:10 AM", keyword: "IN PROGRESS" },
    { id: "j-3", sender: "Jamuna", text: "BLOCKER: The client has not confirmed the color codes for the status badges yet; awaiting their branding guide.", timestamp: "10:40 AM", keyword: "BLOCKER" },
    { id: "j-4", sender: "Jamuna", text: "TO BE DONE: Connect client review comments into the active design layout.", timestamp: "11:30 AM", keyword: "TO BE DONE" },
    { id: "j-5", sender: "Jamuna", text: "COMPLETED exporting the high-resolution dashboard assets to our assets folder.", timestamp: "1:05 PM", keyword: "Completed" },
    { id: "j-6", sender: "Jamuna", text: "IN PROGRESS with standard layout optimizations for mobile screen heights.", timestamp: "2:45 PM", keyword: "IN PROGRESS" },
    { id: "j-7", sender: "Jamuna", text: "TO BE DONE: Redraw the network connection flow diagram once the architecture receives final approval.", timestamp: "4:00 PM", keyword: "TO BE DONE" },

    // --- Pushpak (17) ---
    { id: "p-1", sender: "Pushpak", text: "COMPLETED the installation and config of the node_modules cache inside GitHub actions workflow.", timestamp: "8:30 AM", keyword: "Completed" },
    { id: "p-2", sender: "Pushpak", text: "IN PROGRESS debugging the intermittent build failures during Vite compilation.", timestamp: "9:05 AM", keyword: "IN PROGRESS" },
    { id: "p-3", sender: "Pushpak", text: "BLOCKER: Google Cloud build system limit exceeded on active concurrent workers; need Vikram to upgrade quota.", timestamp: "9:40 AM", keyword: "BLOCKER" },
    { id: "p-4", sender: "Pushpak", text: "TO BE DONE: Write the shell scripts for automated daily database sanity reporting.", timestamp: "10:15 AM", keyword: "TO BE DONE" },
    { id: "p-5", sender: "Pushpak", text: "COMPLETED cleaning up stale sandbox docker volumes from the host nodes.", timestamp: "10:55 AM", keyword: "Completed" },
    { id: "p-6", sender: "Pushpak", text: "IN PROGRESS reviewing security group rules for our private SQL databases.", timestamp: "11:25 AM", keyword: "IN PROGRESS" },
    { id: "p-7", sender: "Pushpak", text: "BLOCKER: Our developer staging site domain is returning a 502 Bad Gateway response; troubleshooting reverse proxy config.", timestamp: "12:10 PM", keyword: "BLOCKER" },
    { id: "p-8", sender: "Pushpak", text: "TO BE DONE: Set up health checkers for our primary cloud run containers.", timestamp: "1:15 PM", keyword: "TO BE DONE" },
    { id: "p-9", sender: "Pushpak", text: "COMPLETED migrating static assets to Google CDN storage buckets.", timestamp: "1:45 PM", keyword: "Completed" },
    { id: "p-10", sender: "Pushpak", text: "IN PROGRESS fine-tuning the restart criteria for node process managers.", timestamp: "2:10 PM", keyword: "IN PROGRESS" },
    { id: "p-11", sender: "Pushpak", text: "BLOCKER: Certbot fails on challenge verification due to firewall restriction on port 80.", timestamp: "2:50 PM", keyword: "BLOCKER" },
    { id: "p-12", sender: "Pushpak", text: "TO BE DONE: Create an admin panel access policy template for team roles.", timestamp: "3:15 PM", keyword: "TO BE DONE" },
    { id: "p-13", sender: "Pushpak", text: "COMPLETED configuring logging scopes inside our development environment.", timestamp: "3:40 PM", keyword: "Completed" },
    { id: "p-14", sender: "Pushpak", text: "IN PROGRESS configuring a lightweight backup worker thread in Node.", timestamp: "4:05 PM", keyword: "IN PROGRESS" },
    { id: "p-15", sender: "Pushpak", text: "BLOCKER: High latency reported across Asian region server clusters; reviewing routing targets.", timestamp: "4:30 PM", keyword: "BLOCKER" },
    { id: "p-16", sender: "Pushpak", text: "TO BE DONE: Test performance of auto-scaling metrics under load.", timestamp: "4:45 PM", keyword: "TO BE DONE" },
    { id: "p-17", sender: "Pushpak", text: "COMPLETED updating Node engine constraints inside package.json to v22 LTS.", timestamp: "5:00 PM", keyword: "Completed" },

    // --- Vaibhali (20) ---
    { id: "v-1", sender: "Vaibhali", text: "COMPLETED the responsive draft for the team leader dashboard homepage.", timestamp: "8:10 AM", keyword: "Completed" },
    { id: "v-2", sender: "Vaibhali", text: "IN PROGRESS adding Framer Motion layout transitions for selected state views.", timestamp: "8:40 AM", keyword: "IN PROGRESS" },
    { id: "v-3", sender: "Vaibhali", text: "BLOCKER: Recharts bar chart colors are clashing horribly with dark theme requirements.", timestamp: "9:10 AM", keyword: "BLOCKER" },
    { id: "v-4", sender: "Vaibhali", text: "TO BE DONE: Implement the list navigation structure for the user selection sidebar.", timestamp: "9:35 AM", keyword: "TO BE DONE" },
    { id: "v-5", sender: "Vaibhali", text: "COMPLETED creating reusable button sets with tailwind transition duration configs.", timestamp: "10:00 AM", keyword: "Completed" },
    { id: "v-6", sender: "Vaibhali", text: "IN PROGRESS refining the loading spinners with custom-styled keyframes.", timestamp: "10:30 AM", keyword: "IN PROGRESS" },
    { id: "v-7", sender: "Vaibhali", text: "BLOCKER: Touch targets on the mobile drawer represent less than 44px; need to rewrite spacing rules.", timestamp: "11:00 AM", keyword: "BLOCKER" },
    { id: "v-8", sender: "Vaibhali", text: "TO BE DONE: Configure custom font weights for Inter display styles across layout cards.", timestamp: "11:30 AM", keyword: "TO BE DONE" },
    { id: "v-9", sender: "Vaibhali", text: "COMPLETED cleaning the duplicate Tailwind layers within the main stylesheet.", timestamp: "12:00 PM", keyword: "Completed" },
    { id: "v-10", sender: "Vaibhali", text: "IN PROGRESS connecting mock state inputs with active client viewports.", timestamp: "1:00 PM", keyword: "IN PROGRESS" },
    { id: "v-11", sender: "Vaibhali", text: "BLOCKER: The SVG generator is dropping linear attributes on standard iOS builds.", timestamp: "1:30 PM", keyword: "BLOCKER" },
    { id: "v-12", sender: "Vaibhali", text: "TO BE DONE: Re-adjust grid columns inside the history listing section.", timestamp: "2:00 PM", keyword: "TO BE DONE" },
    { id: "v-13", sender: "Vaibhali", text: "COMPLETED implementing responsive paddings to fit 13-inch laptop viewports nicely.", timestamp: "2:30 PM", keyword: "Completed" },
    { id: "v-14", sender: "Vaibhali", text: "IN PROGRESS mapping interactive user details into the top-right header view.", timestamp: "3:00 PM", keyword: "IN PROGRESS" },
    { id: "v-15", sender: "Vaibhali", text: "BLOCKER: React re-renders infinitely when selecting users fast due to un-memoized context filters.", timestamp: "3:30 PM", keyword: "BLOCKER" },
    { id: "v-16", sender: "Vaibhali", text: "TO BE DONE: Introduce standard keyboard accessibility handlers for drawer toggles.", timestamp: "4:00 PM", keyword: "TO BE DONE" },
    { id: "v-17", sender: "Vaibhali", text: "COMPLETED the high fidelity wireframes for audit record print screens.", timestamp: "4:30 PM", keyword: "Completed" },
    { id: "v-18", sender: "Vaibhali", text: "IN PROGRESS adjusting border-radius properties to align with modern Swiss minimal theme.", timestamp: "4:50 PM", keyword: "IN PROGRESS" },
    { id: "v-19", sender: "Vaibhali", text: "BLOCKER: Hover scales trigger scrollbars on 1080p outputs.", timestamp: "5:10 PM", keyword: "BLOCKER" },
    { id: "v-20", sender: "Vaibhali", text: "TO BE DONE: Discuss modal exit transitions with design team layout specialists.", timestamp: "5:30 PM", keyword: "TO BE DONE" },

    // --- Adarsh (6) ---
    { id: "a-1", sender: "Adarsh", text: "COMPLETED drafting the service level agreement files (SLA) for active review.", timestamp: "9:00 AM", keyword: "Completed" },
    { id: "a-2", sender: "Adarsh", text: "IN PROGRESS reviewing security compliance criteria to make sure credentials are kept server-side.", timestamp: "10:30 AM", keyword: "IN PROGRESS" },
    { id: "a-3", sender: "Adarsh", text: "BLOCKER: Client feedback is delayed by 2 days; still waiting for validation on the billing API flow.", timestamp: "12:00 PM", keyword: "BLOCKER" },
    { id: "a-4", sender: "Adarsh", text: "TO BE DONE: Clean the master spreadsheet data columns before uploading back into Supabase tables.", timestamp: "1:30 PM", keyword: "TO BE DONE" },
    { id: "a-5", sender: "Adarsh", text: "COMPLETED generating standard API response error documentation rules.", timestamp: "3:00 PM", keyword: "Completed" },
    { id: "a-6", sender: "Adarsh", text: "IN PROGRESS writing standard guidelines templates for daily standup keywords.", timestamp: "4:30 PM", keyword: "IN PROGRESS" },

    // --- Usha (15) ---
    { id: "u-1", sender: "Usha", text: "COMPLETED writing unit tests for our customized Gemini prompt sanitizers.", timestamp: "8:00 AM", keyword: "Completed" },
    { id: "u-2", sender: "Usha", text: "IN PROGRESS designing a validation matrix for JSON response structure mapping.", timestamp: "8:50 AM", keyword: "IN PROGRESS" },
    { id: "u-3", sender: "Usha", text: "BLOCKER: Testing server quota has been hit; calls to gemini-3.5-flash are failing on client keys.", timestamp: "9:40 AM", keyword: "BLOCKER" },
    { id: "u-4", sender: "Usha", text: "TO BE DONE: Update schema mappings inside PostgreSQL schemas to accommodate detailed summary ticket fields.", timestamp: "10:30 AM", keyword: "TO BE DONE" },
    { id: "u-5", sender: "Usha", text: "COMPLETED auditing user authentication routines to secure token headers.", timestamp: "11:10 AM", keyword: "Completed" },
    { id: "u-6", sender: "Usha", text: "IN PROGRESS measuring response generation latency of Gemini vs structural prompt formats.", timestamp: "11:50 AM", keyword: "IN PROGRESS" },
    { id: "u-7", sender: "Usha", text: "BLOCKER: Standard test dataset is returning null value categories on specific edge-case standup entries.", timestamp: "1:00 PM", keyword: "BLOCKER" },
    { id: "u-8", sender: "Usha", text: "TO BE DONE: Test dynamic batch processing using small sliding windows.", timestamp: "1:45 PM", keyword: "TO BE DONE" },
    { id: "u-9", sender: "Usha", text: "COMPLETED checking code structures against strict linter guidelines.", timestamp: "2:30 PM", keyword: "Completed" },
    { id: "u-10", sender: "Usha", text: "IN PROGRESS mapping the structural JSON parser endpoints with Express routes.", timestamp: "3:15 PM", keyword: "IN PROGRESS" },
    { id: "u-11", sender: "Usha", text: "BLOCKER: Missing env configs for standard JWT security keys inside build system container variables.", timestamp: "3:50 PM", keyword: "BLOCKER" },
    { id: "u-12", sender: "Usha", text: "TO BE DONE: Refactor response helper helper functions for generic reuse.", timestamp: "4:15 PM", keyword: "TO BE DONE" },
    { id: "u-13", sender: "Usha", text: "COMPLETED the optimization of raw input prompts reducing input tokens size by 30%.", timestamp: "4:40 PM", keyword: "Completed" },
    { id: "u-14", sender: "Usha", text: "IN PROGRESS benchmarking parallel API dispatch triggers.", timestamp: "5:00 PM", keyword: "IN PROGRESS" },
    { id: "u-15", sender: "Usha", text: "TO BE DONE: Sync standard unit test assertions with actual model responses.", timestamp: "5:15 PM", keyword: "TO BE DONE" },

    // --- Naga (11) ---
    { id: "n-1", sender: "Naga", text: "COMPLETED deploying the frontend codebase to the server staging server node.", timestamp: "8:40 AM", keyword: "Completed" },
    { id: "n-2", sender: "Naga", text: "IN PROGRESS monitoring system health graphs on active memory utilization.", timestamp: "9:50 AM", keyword: "IN PROGRESS" },
    { id: "n-3", sender: "Naga", text: "BLOCKER: Live websockets are periodically disconnecting on poor wifi connections with no automatic reconnection.", timestamp: "10:30 AM", keyword: "BLOCKER" },
    { id: "n-4", sender: "Naga", text: "TO BE DONE: Code clean re-try capabilities to prevent web socket drop failures.", timestamp: "11:20 AM", keyword: "TO BE DONE" },
    { id: "n-5", sender: "Naga", text: "COMPLETED setting up standard redirect rules with ssl redirection targets.", timestamp: "12:50 PM", keyword: "Completed" },
    { id: "n-6", sender: "Naga", text: "IN PROGRESS writing shell script routines to clean tmp logging folder data.", timestamp: "2:00 PM", keyword: "IN PROGRESS" },
    { id: "n-7", sender: "Naga", text: "BLOCKER: Nginx rejects large standup update inputs with 413 payload too large errors.", timestamp: "2:50 PM", keyword: "BLOCKER" },
    { id: "n-8", sender: "Naga", text: "TO BE DONE: Readjust reverse-proxy max client body attributes.", timestamp: "3:40 PM", keyword: "TO BE DONE" },
    { id: "n-9", sender: "Naga", text: "COMPLETED cleaning the dev branch directory to minimize file diffs before merging.", timestamp: "4:20 PM", keyword: "Completed" },
    { id: "n-10", sender: "Naga", text: "IN PROGRESS optimizing DNS resolution timeouts within standard routes.", timestamp: "4:50 PM", keyword: "IN PROGRESS" },
    { id: "n-11", sender: "Naga", text: "TO BE DONE: Update deployment scripts to support dynamic database credentials fetching.", timestamp: "5:10 PM", keyword: "TO BE DONE" }
  ];

  // Prepopulate history list with 3 completed tickets from yesterday to ensure history works immediately on load
  const initialHistory = [
    {
      id: "STND-20260619-01",
      sender: "Adarsh",
      processedAt: "2026-06-19T17:15:22.000Z",
      rawMessages: [
        { id: "a-old-1", sender: "Adarsh", text: "COMPLETED setting up standard billing database metrics.", timestamp: "9:10 AM", keyword: "Completed" },
        { id: "a-old-2", sender: "Adarsh", text: "IN PROGRESS tracking merchant security compliance documents.", timestamp: "11:00 AM", keyword: "IN PROGRESS" },
        { id: "a-old-3", sender: "Adarsh", text: "BLOCKER: Payment gateway is throwing recurring 503 errors.", timestamp: "2:15 PM", keyword: "BLOCKER" }
      ],
      segregated: {
        blockers: ["Payment gateway is throwing recurring 503 errors affecting merchant balance settlements."],
        toBeDone: ["Align compliance checks for other region merchants."],
        completed: ["Setting up standard billing database metrics and audit routines."],
        inProgress: ["Tracking merchant security compliance documentation and status updates."],
        summary: "Adarsh successfully implemented the core billing database metrics, but is currently blocked by recurring 503 gateway errors from the payment provider."
      }
    },
    {
      id: "STND-20260619-02",
      sender: "Kunal",
      processedAt: "2026-06-19T18:02:11.000Z",
      rawMessages: [
        { id: "k-old-1", sender: "Kunal", text: "COMPLETED rewriting authorization middle-wares for high throughput.", timestamp: "10:30 AM", keyword: "Completed" },
        { id: "k-old-2", sender: "Kunal", text: "BLOCKER: Standard local Redis server port is throwing access-denitied errors.", timestamp: "3:00 PM", keyword: "BLOCKER" }
      ],
      segregated: {
        blockers: ["Local Redis server port is showing connection access-denied warnings."],
        toBeDone: ["Stress-test the new cache bypass flows tomorrow."],
        completed: ["Rewriting authorization microservices and Express middlewares for faster requests parsing."],
        inProgress: ["Investigating cache cluster nodes stability."],
        summary: "Kunal optimized the access and token authentication middleware, but needs Docker security privileges to resolve standard ports restriction blockages on Redis."
      }
    },
    {
      id: "STND-20260619-03",
      sender: "Jamuna",
      processedAt: "2026-06-19T18:45:00.000Z",
      rawMessages: [
        { id: "j-old-1", sender: "Jamuna", text: "COMPLETED design mockup for daily summary report sheets.", timestamp: "2:40 PM", keyword: "Completed" },
        { id: "j-old-2", sender: "Jamuna", text: "IN PROGRESS styling active tab bar animations.", timestamp: "4:15 PM", keyword: "IN PROGRESS" }
      ],
      segregated: {
        blockers: [],
        toBeDone: ["Review typography pairings with Vikram team representatives."],
        completed: ["Created clean page designs for daily standup pdf reports exports."],
        inProgress: ["Coding bouncy interaction states for layout side navigation selections."],
        summary: "Jamuna finalized critical reports formatting drafts, and is busy programming seamless navigation layout effects."
      }
    }
  ];

  const initialState = {
    activeMessages: initialMessages,
    tickets: initialHistory,
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(initialState, null, 2));
  return initialState;
}

// Instantiate internal state
let store = getOrInitializeStore();

function saveStore() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

const app = express();
const PORT = 3000;

app.use(express.json());

  // API 1: Fetch overall dashboard status (users + outstanding counts + totals)
  app.get("/api/dashboard/status", (req, res) => {
    const userStats = TEAM_MEMBERS.map((u) => {
      const pendingMessages = store.activeMessages.filter(
        (m: any) => m.sender.toLowerCase() === u.name.toLowerCase()
      );
      return {
        ...u,
        pendingCount: pendingMessages.length,
      };
    });

    const totalPending = store.activeMessages.length;
    res.json({
      team: userStats,
      totalPendingCount: totalPending,
      ticketsCount: store.tickets.length,
    });
  });

  // API 2: Fetch raw messages of a user that are pending segregation
  app.get("/api/dashboard/messages/:userId", (req, res) => {
    const { userId } = req.params;
    const member = TEAM_MEMBERS.find((u) => u.id === userId);
    if (!member) {
      return res.status(404).json({ error: "User not found" });
    }

    const messages = store.activeMessages.filter(
      (m: any) => m.sender.toLowerCase() === member.name.toLowerCase()
    );

    res.json({
      user: member,
      messages,
    });
  });

  // API 3: Fetch history of last 50 processed standup tickets
  app.get("/api/dashboard/history", (req, res) => {
    // Keep it reverse sorted so most recent processed ticket comes first
    const sorted = [...store.tickets].sort(
      (a: any, b: any) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
    );
    res.json(sorted.slice(0, 50));
  });

  // API 4: Reset all standup pool states back to beginning (useful for demo testings)
  app.post("/api/dashboard/reset", (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
    store = getOrInitializeStore();
    res.json({ success: true, message: "Standup messages pool re-established successfully!" });
  });

  // API 5: Segregate using Google Gemini!
  app.post("/api/dashboard/segregate", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "UserId is required" });
    }

    const member = TEAM_MEMBERS.find((u) => u.id === userId);
    if (!member) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get the pending messages for this user
    const pendingMessages = store.activeMessages.filter(
      (m: any) => m.sender.toLowerCase() === member.name.toLowerCase()
    );

    if (pendingMessages.length === 0) {
      return res.status(400).json({ error: `No active messages in pool for ${member.name}` });
    }

    // Prepare prompt
    const messagesPromptText = pendingMessages
      .map((m: any, i: number) => `Message ${i + 1} (${m.timestamp}): "${m.text}" (Keyword: ${m.keyword})`)
      .join("\n");

    const prompt = `
You are the elite Daily Standup Summarizer AI for Vikram's engineering team. 
We have a pool of daily standup messages from the team member named ${member.name}. 
Your goal is to parse and organize these messages into exactly 4 categories (referred to as "mini sub-dashboards"):
1. "BLOCKER" (Issues blocking progress, unresolved dependencies, critical errors, awaiting answers)
2. "TO BE DONE" (Planned tasks, next steps, future plans)
3. "Completed" (Ticked-off requirements, completed items, resolved issues)
4. "IN PROGRESS" (Ongoing development, current focus, active investigations)

In addition, write a concise, professional 2-sentence executive summary summarizing ${member.name}'s status for Vikram to report to senior leadership today.

Extract all statements into these structural lists. Keep bullet items clear, human-readable, and action-oriented. Do not alter their core technical meaning but clean up minor spelling errors.

Here are the raw messages to segregate:
${messagesPromptText}
`;

    try {
      // Call Gemini 3.5 Flash!
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert product manager and technical coordinator. Parse, group, and summarize standup bullet points into clean, scannable JSON fields.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              blockers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of items qualifying as BLOCKERs. Leave empty if none exist."
              },
              toBeDone: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of items qualifying as TO BE DONE. Leave empty if none exist."
              },
              completed: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of items qualifying as Completed. Leave empty if none exist."
              },
              inProgress: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of items qualifying as IN PROGRESS. Leave empty if none exist."
              },
              summary: {
                type: Type.STRING,
                description: "A cohesive, elegant, high-level status summary for Vikram. Max 2 concise sentences."
              }
            },
            required: ["blockers", "toBeDone", "completed", "inProgress", "summary"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini API");
      }

      const parsedResult = JSON.parse(responseText.trim());

      // Create new ticket
      const ticketId = `STND-${new Date().toISOString().slice(0,10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
      const newTicket = {
        id: ticketId,
        sender: member.name,
        processedAt: new Date().toISOString(),
        rawMessages: pendingMessages,
        segregated: parsedResult,
      };

      // Store ticket in central history log, limit to last 50
      store.tickets.unshift(newTicket);
      if (store.tickets.length > 50) {
        store.tickets = store.tickets.slice(0, 50);
      }

      // REMOVE these messages from the active message pool so the circular badge updates!
      store.activeMessages = store.activeMessages.filter(
        (m: any) => m.sender.toLowerCase() !== member.name.toLowerCase()
      );

      // Save our persistent database back to file
      saveStore();

      res.json(newTicket);
    } catch (err: any) {
      console.error("Gemini segregation error:", err);
      res.status(500).json({
        error: "Failed to segregate standup data with Gemini",
        details: err.message || err
      });
    }
  });

  // API 6: Delete a specific historical ticket
  app.delete("/api/dashboard/history/:ticketId", (req, res) => {
    const { ticketId } = req.params;
    const initialLen = store.tickets.length;
    store.tickets = store.tickets.filter((t: any) => t.id !== ticketId);
    
    if (store.tickets.length === initialLen) {
      return res.status(404).json({ error: "Ticket not found in history" });
    }

    saveStore();
    res.json({ success: true, message: `Ticket ${ticketId} deleted from records!` });
  });

  // Integrate Vite Dev Server Middleware or Static Production Build
  async function setupVite() {
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }
  setupVite();

  // Start listening on port 3000
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}...`);
    });
  }

export default app;
