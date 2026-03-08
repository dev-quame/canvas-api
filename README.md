# Portfolio Contact API

Express API for the portfolio contact form.

## Endpoints

- `GET /api/health` - health check
- `POST /api/forms` - submit contact form

## Environment Variables

- `PORT` - API port (default: `5000`)
- `MONGO_URI` - optional MongoDB connection string
- `RESEND_API_KEY` - Resend API key
- `EMAIL_TO` - recipient email(s), comma-separated
- `EMAIL_FROM` - sender identity (default: `Portfolio <onboarding@resend.dev>`)
- `CLIENT_URL` - allowed CORS origin(s), comma-separated
- `CLIENT_URLS` - optional extra CORS origin(s), comma-separated

## Local Run

1. Install deps: `npm install`
2. Add `.env`
3. Start dev server: `npm run dev`

## Production Readiness Notes

- Input validation enforced server-side (length + email format)
- Rate limiting enabled on form endpoint
- CORS allowlist enforced
- JSON parse errors and CORS failures return JSON responses
- Database persistence is optional; API still sends email if DB is unavailable
