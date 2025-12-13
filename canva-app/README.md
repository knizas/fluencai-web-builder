# Fluencai Canva App

This is the frontend app that runs inside Canva's editor, allowing users to export their designs as websites.

## 📁 Project Structure

```
canva-app/
├── src/
│   ├── App.tsx              # Main app component
│   ├── App.module.css       # App styles
│   ├── index.tsx            # React entry point
│   └── index.css            # Global styles
├── translations/
│   └── en-US.json           # Required translation file for Canva
├── package.json
├── vite.config.ts           # Bundler configuration
└── tsconfig.json            # TypeScript configuration
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd canva-app
npm install
```

### 2. Start Development Server

```bash
npm start
```

This will start the app on **http://localhost:8080** (required by Canva).

### 3. Configure in Canva Developer Portal

1. Go to https://www.canva.com/developers/
2. Create or select your app
3. Under **App source**:
   - **Development URL**: `http://localhost:8080`
4. Under **Translations**:
   - Upload `translations/en-US.json`

### 4. Preview in Canva

Once configured, you can preview your app directly inside Canva:
- Open any Canva design
- Your app will appear in the Apps panel
- Click it to test the integration

## 📦 Building for Production

```bash
npm run build
```

This creates a `dist/` folder with the bundled app. Upload the JavaScript file from `dist/assets/` to Canva when submitting for review.

## 🔧 How It Works

1. **User clicks "Generate Website"** in Canva
2. **App exports all pages** as PNG (and structured data when available)
3. **Sends to Fluencai API** (`https://web-builder.fluencai.com/api/canva/generate`)
4. **Receives preview URL** of the generated website
5. **Shows success message** with link to view the site

## 🔗 API Integration

The app communicates with your Fluencai backend:
- **Endpoint**: `https://web-builder.fluencai.com/api/canva/generate`
- **Method**: POST
- **Payload**: `{ pages: [], designId: string, designTitle: string }`
- **Response**: `{ previewUrl: string, projectId: string }`

## 📝 Environment Variables

For development, you can change the API URL in `src/App.tsx`:

```typescript
const API_URL = 'http://localhost:3000' // For local testing
// const API_URL = 'https://web-builder.fluencai.com' // For production
```

## 🎨 Customization

- **Branding**: Update colors in `App.module.css`
- **Text**: Modify `translations/en-US.json`
- **Features**: Add more functionality in `App.tsx`

## 📚 Resources

- [Canva Apps SDK Documentation](https://www.canva.dev/docs/apps/)
- [Canva App UI Kit](https://www.canva.dev/docs/apps/app-ui-kit/)
- [Bundling Apps](https://www.canva.dev/docs/apps/bundling/)
