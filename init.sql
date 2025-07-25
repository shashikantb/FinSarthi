-- Custom Enum Types
CREATE TYPE "role" AS ENUM ('customer', 'coach');
CREATE TYPE "gender" AS ENUM ('male', 'female', 'other');
CREATE TYPE "chat_request_status" AS ENUM ('pending', 'accepted', 'declined', 'closed');
CREATE TYPE "language" AS ENUM ('en', 'hi', 'mr', 'de');

-- Users Table
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text,
	"email" text,
	"phone" text,
	"password_hash" text,
	"age" integer,
	"city" text,
	"country" text,
	"gender" "gender",
	"role" "role" DEFAULT 'customer' NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);

-- Advice Sessions Table
CREATE TABLE IF NOT EXISTS "advice_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"prompt_key" text NOT NULL,
	"form_data" jsonb NOT NULL,
	"language" "language" NOT NULL,
	"generated_advice" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Chat Requests Table
CREATE TABLE IF NOT EXISTS "chat_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"coach_id" text NOT NULL,
	"status" "chat_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_request_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Foreign Key Constraints
DO $$ BEGIN
 ALTER TABLE "advice_sessions" ADD CONSTRAINT "advice_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "chat_requests" ADD CONSTRAINT "chat_requests_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "chat_requests" ADD CONSTRAINT "chat_requests_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_request_id_chat_requests_id_fk" FOREIGN KEY ("chat_request_id") REFERENCES "public"."chat_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
