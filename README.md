# Ad Rank Controller

A clean, minimal web application for collecting inputs to help rank products at position #1 on a marketplace. This is strictly a configuration dashboard with no automation or external API integrations.

## Tech Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Architecture**: MVC Pattern

## Features

- **Section A - Product Selection**: Product ID/SKU, Name, Category, Brand, Current Rank, Target Rank
- **Section B - Ad Type Selection**: Multiple ad types with priority levels (Low, Medium, High)
- **Section C - Targeting Rules**: City, Pincode, Time Slot, Day Type, Search Keywords, Category Match
- **Campaign Management**: View all saved campaigns in a table format

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

## Installation

1. Install root dependencies:
```bash
npm install
```

2. Install client dependencies:
```bash
cd client
npm install
cd ..
```

Or use the convenience script:
```bash
npm run install-all
```

3. Create a `.env` file in the root directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ad-rank-controller
```

## Running the Application

### Development Mode (Both Server and Client)

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### Run Separately

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run client
```

## Project Structure

```
Dashboard/
├── server/
│   ├── models/
│   │   └── Campaign.js          # MongoDB schema
│   ├── controllers/
│   │   └── campaignController.js # Business logic
│   ├── routes/
│   │   └── campaignRoutes.js    # API routes
│   └── server.js                # Express server setup
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── sections/        # Form sections
│   │   │   ├── Dashboard.tsx    # Main dashboard
│   │   │   └── CampaignList.tsx # Campaign table
│   │   ├── services/
│   │   │   └── api.ts           # API service
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript types
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
├── package.json
└── README.md
```

## API Endpoints

### POST /api/campaigns
Create a new campaign.

**Request Body:**
```json
{
  "productId": "SKU123",
  "productName": "Sample Product",
  "category": "Electronics",
  "brand": "Brand Name",
  "currentRank": 10,
  "targetRank": 1,
  "adTypes": [
    {
      "type": "Product Ads",
      "priority": "High"
    }
  ],
  "targeting": {
    "city": "Mumbai",
    "pincode": 400001,
    "timeSlot": {
      "start": "09:00",
      "end": "18:00"
    },
    "dayType": "Weekday",
    "keywords": ["keyword1", "keyword2"],
    "categoryMatch": true
  }
}
```

### GET /api/campaigns
Get all campaigns.

**Response:**
```json
{
  "count": 1,
  "campaigns": [...]
}
```

## Notes

- No authentication is implemented (MVP)
- No bidding, CPC, budget, or ROAS fields
- No external marketplace API integrations
- This is purely a configuration input panel

## License

ISC



