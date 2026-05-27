# Lohverse Skills Academy Portal

A modern React-based assessment and learning platform built with Vite and styled with contemporary gradient designs.

## 📋 Project Overview

Lohverse is a professional assessment portal designed for online learning and skill evaluation. It features:
- Beautiful gradient-based UI with purple and blue theme
- Responsive design for all devices
- Interactive course listing with status tracking
- Dynamic test management system
- Smooth animations and hover effects

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

The project has already been created with all dependencies installed!

If you need to install dependencies manually:
```bash
npm install
```

### Running the Development Server

The dev server is already running at: **http://localhost:5173/**

To manually start the dev server:
```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
lohverse-portal/
├── src/
│   ├── LohversePortal.jsx      # Main component
│   ├── LohversePortal.css      # Component styles
│   ├── App.jsx                 # App wrapper component
│   ├── App.css                 # App styles
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── public/                      # Static assets
├── index.html                   # HTML template
├── vite.config.js              # Vite configuration
└── package.json                # Dependencies
```

## 🎨 Features

### Color Scheme
- **Primary Gradient**: `#667eea` → `#764ba2` (Purple-Blue)
- **Accent**: White with gradient text
- **Background**: Light with gradient overlays

### Components
1. **Navigation Bar**: Logo, menu links, authentication buttons
2. **Hero Section**: Headline, description, call-to-action buttons
3. **Feature List**: 3 key value propositions
4. **Learning Path Card**: Course listings with status and details

### Interactive Elements
- Hover effects on buttons and course cards
- Smooth transitions and animations
- Responsive button states
- Dynamic course status badges

## 📱 Responsive Design

The portal is fully responsive with breakpoints:
- **Desktop**: Full 2-column grid layout
- **Tablet (≤1024px)**: Single column layout
- **Mobile (≤768px)**: Mobile-optimized with full-width buttons

## 🔧 Customization

### Change Colors
Edit the gradient colors in `LohversePortal.css`:
```css
background: linear-gradient(135deg, #667eea, #764ba2);
```

### Add New Courses
Update the `tests` state in `LohversePortal.jsx`:
```jsx
const [tests] = useState([
  {
    id: 1,
    title: 'Your Course Title',
    duration: '90 mins',
    questions: '30 Questions',
    attempts: '3 Attempts Remaining',
    availability: 'Available until Jan 15, 2026',
    status: 'start', // or 'Scheduled'
  },
  // Add more courses...
]);
```

### Add Event Handlers
Example adding click handlers to buttons:
```jsx
const handleStartCourse = (courseId) => {
  console.log(`Starting course: ${courseId}`);
  // Add your logic here
};

const handleExploreCourses = () => {
  console.log('Exploring courses');
  // Add navigation logic
};
```

## 🎯 Next Steps

1. **Replace placeholder content**: Update course titles, descriptions, and details
2. **Integrate backend API**: Connect to your assessment system
3. **Add authentication**: Implement user login/registration
4. **Setup routing**: Use React Router for multi-page navigation
5. **Deploy**: Push to Vercel, Netlify, or your preferred hosting

## 📦 Tech Stack

- **React** 18+ - UI library
- **Vite** 8+ - Build tool
- **CSS3** - Styling with gradients and animations
- **JavaScript ES6+** - Modern JavaScript

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 Notes

- The component uses React hooks (`useState`) for state management
- CSS uses modern features like CSS Grid, Flexbox, and Gradients
- All styles are scoped to prevent conflicts
- The design is mobile-first and progressively enhanced

## 📄 License

This project is free to use and modify for your needs.

## 💡 Tips

- The gradient colors work well together - adjust the angle and colors to match your brand
- The portal is designed to be extensible - easily add new sections and components
- Consider adding React Router for multi-page navigation in the future
- Use the responsive design as a base for further customization

---

**Happy Learning! 🚀**
