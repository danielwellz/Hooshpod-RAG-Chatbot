import { Document, Schema, model } from "mongoose";

export type MessageRole = "user" | "assistant" | "system";

export interface MessageDocument extends Document {
  conversationId: string;
  role: MessageRole;
  content: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<MessageDocument>(
  {
    conversationId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Message = model<MessageDocument>("Message", messageSchema);
