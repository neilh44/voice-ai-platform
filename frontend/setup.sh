#!/bin/bash

# This script creates the necessary folder structure for Shadcn UI components

# Create main directories
mkdir -p src/components/ui
mkdir -p src/lib

# Copy the component files to the correct locations
# Assuming these files are in the current directory

# First, move the lib/utils.js file
cp lib/utils.js src/lib/utils.js

# Then, move the UI components
cp components/ui/button.jsx src/components/ui/button.jsx
cp components/ui/card.jsx src/components/ui/card.jsx
cp components/ui/alert.jsx src/components/ui/alert.jsx
cp components/ui/badge.jsx src/components/ui/badge.jsx
cp components/ui/progress.jsx src/components/ui/progress.jsx
cp components/ui/separator.jsx src/components/ui/separator.jsx

# Move the Dashboard component
cp Dashboard.jsx src/components/Dashboard.jsx

# Move the CSS files
cp globals.css src/globals.css

# Move configuration files to the root
cp postcss.config.js ./postcss.config.js
cp tailwind.config.js ./tailwind.config.js

echo "✅ Folder structure and files set up successfully!"