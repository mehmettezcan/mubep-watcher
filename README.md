# Mubep Announcement Watcher (NestJS)

This project monitors the **MUBEP (Muğla Belediyesi Personel A.Ş.)** website for new personnel recruitment announcements. When a new announcement is published, the service automatically detects it and sends a notification via Telegram.

The service is built using NestJS, Cron Jobs, Axios, and Cheerio. It periodically checks the page for changes, stores the last detected announcement locally, and triggers notifications when updates occur. A manual API endpoint is also available for on-demand checks.

---

## Features

* Automatically scrapes the MUBEP website for new recruitment announcements
* Daily scheduled checks through a cron job
* Sends a Telegram notification when a new announcement is detected
* Provides a manual endpoint (`/announcement/check`) for testing

  * Manual checks always send a Telegram message
* Includes Swagger API documentation
* Stores the last detected announcement in `last.json`

---

## Technologies Used

* NestJS
* @nestjs/schedule (Cron jobs)
* @nestjs/axios (HTTP requests)
* Cheerio (HTML parsing)
* Telegram Bot API
* Swagger (API documentation)

---

## Project Structure

```
src/
 ├── announcement/
 │    ├── announcement.module.ts
 │    ├── announcement.service.ts
 │    └── announcement.controller.ts
 ├── app.module.ts
 └── main.ts
last.json        # Stores the last detected announcement
.env             # Environment variables
```

---

## Setup

### Clone the Repository

```bash
git clone https://github.com/username/mubep-watcher.git
cd mubep-watcher
```

### Install Dependencies

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
MUBEP_URL=https://www.mubep.com.tr/
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
TELEGRAM_CHAT_ID=YOUR_CHAT_ID
CHECK_INTERVAL_CRON=0 9 * * *   # Runs every day at 09:00
```

You may adjust the cron expression if needed.

---

## Running the Application

```bash
npm run start:dev
```

The cron job will automatically run at the scheduled time.

---

## Cron Job Behavior

The cron decorator in the service:

```ts
@Cron('0 9 * * *')
```

This configuration runs the announcement check **once per day at 09:00**.

---

## Manual Check (Always Sends Telegram Notification)

You can manually trigger a check using:

```
GET /announcement/check
```

Swagger UI:

```
http://localhost:3000/api
```

The manual check always sends a Telegram message for testing purposes.

---

## Telegram Bot Setup (Summary)

1. Open **@BotFather** in Telegram
2. Create a bot using `/newbot`
3. Copy the bot token
4. Start a chat with your bot
5. Retrieve your chat ID using the Telegram API (`getUpdates`)

---

## Swagger Documentation

Once the service is running, Swagger is available at:

```
http://localhost:3000/api
```

---

## last.json

This file stores the last detected announcement information.
It is ignored via `.gitignore`:

```
last.json
```

If deleted, the application will recreate it.

---

## Docker (Optional)

A Dockerfile and docker-compose configuration can be added upon request.

---

## Contributing

Contributions, issues, and feature requests are welcome.

---

## License

This project is licensed under the MIT License.
