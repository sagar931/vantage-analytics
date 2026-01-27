// This function breaks down the filename into usable data
// Format expected: GMD01_Unsecured_PL_M_Jan2025.xlsx
export const parseFileName = (fileName) => {
  // Remove extension
  const cleanName = fileName.replace(/\.xlsx$/i, '');
  
  // We split by '_' but we need to be careful if the Name itself has underscores.
  // We know the structure is: ID_NAME...NAME_FREQ_DATE
  const parts = cleanName.split('_');
  
  // Safe parsing: 
  // The first part is always ID (GMD01)
  // The last part is always Date (Jan2025)
  // The second-to-last is Frequency (M or Q)
  // Everything in the middle is the Model Name
  
  if (parts.length < 4) return null; // Invalid file format

  const id = parts[0];
  const dateStr = parts[parts.length - 1];
  const freqCode = parts[parts.length - 2];
  
  // Rejoin the middle parts to get the full name
  const name = parts.slice(1, parts.length - 2).join('_');

  return {
    id,
    name,
    frequency: freqCode === 'M' ? 'Monthly' : 'Quarterly',
    period: dateStr,
    originalName: fileName
  };
};

// This function recursively searches folders for .xlsx files
export const scanDirectory = async (dirHandle) => {
  const models = {}; // We will group files by Model ID

  for await (const entry of dirHandle.values()) {
    
    if (entry.kind === 'file' && entry.name.endsWith('.xlsx')) {
      const metadata = parseFileName(entry.name);
      
      if (metadata) {
        // If this is the first time we see this Model ID, create the group
        if (!models[metadata.id]) {
          models[metadata.id] = {
            id: metadata.id,
            name: metadata.name,
            files: []
          };
        }
        
        // Add the file handle (the key to reading data later) to our list
        models[metadata.id].files.push({
          ...metadata,
          handle: entry
        });
      }
    } 
    
    else if (entry.kind === 'directory') {
      // If it's a folder, dive inside (Recursion)
      const subResults = await scanDirectory(entry);
      
      // Merge sub-folder results into our main list
      Object.keys(subResults).forEach(key => {
        if (!models[key]) {
          models[key] = subResults[key];
        } else {
          models[key].files = [...models[key].files, ...subResults[key].files];
        }
      });
    }
  }

  return models;
};