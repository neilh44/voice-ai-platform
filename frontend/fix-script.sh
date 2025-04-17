#!/bin/bash

# Create components directory if it doesn't exist
mkdir -p src/components

# Fix Dashboard.js export
if grep -q "export default Dashboard" src/components/Dashboard.js; then
  echo "Dashboard.js already has export default statement"
else
  echo "export default Dashboard;" >> src/components/Dashboard.js
  echo "Fixed Dashboard.js export"
fi

# Fix ScriptEditor.js export
if grep -q "export default ScriptEditor" src/components/ScriptEditor.js; then
  echo "ScriptEditor.js already has export default statement"
else
  echo "export default ScriptEditor;" >> src/components/ScriptEditor.js
  echo "Fixed ScriptEditor.js export"
fi

# Fix ScriptEditor.js reference to undefined variables
sed -i '' 's/\{\{date\}\}/\{\{appointmentDate\}\}/g' src/components/ScriptEditor.js
sed -i '' 's/\{\{time\}\}/\{\{appointmentTime\}\}/g' src/components/ScriptEditor.js

# Fix Dashboard.js undefined CloudUpload
sed -i '' 's/<CloudUpload/<UploadIcon/g' src/components/Dashboard.js

# Ensure all components export properly
for file in src/components/*.js; do
  filename=$(basename "$file")
  component_name="${filename%.js}"
  
  # Skip files we already fixed
  if [ "$component_name" == "Dashboard" ] || [ "$component_name" == "ScriptEditor" ]; then
    continue
  fi
  
  if grep -q "export default $component_name" "$file"; then
    echo "$filename already has export default statement"
  else
    echo "export default $component_name;" >> "$file"
    echo "Fixed $filename export"
  fi
done

echo "Fixes applied. Try running npm start again."