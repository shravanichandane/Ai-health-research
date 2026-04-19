import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  // Structured input fields
  patientName: String,
  disease: String,
  query: String,
  location: String,
  // Response data
  publications: [mongoose.Schema.Types.Mixed],
  trials: [mongoose.Schema.Types.Mixed],
  sources: [mongoose.Schema.Types.Mixed],
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema({
  title: { type: String, default: "New Research Session" },
  // Context tracking for multi-turn
  context: {
    disease: String,
    lastQuery: String,
    location: String,
    patientName: String,
    topics: [String],
  },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

conversationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Conversation = mongoose.model("Conversation", conversationSchema);
