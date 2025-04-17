import os
import json
import sqlite3
import re
from datetime import datetime

class KnowledgeService:
    def __init__(self):
        pass
    
    def process_document(self, file_path, user_id, kb_name):
        """Process an uploaded document and extract knowledge"""
        # This is a simplified implementation
        # In a real application, you would:
        # 1. Extract text from different file types (PDF, DOCX, etc.)
        # 2. Chunk the text into manageable pieces
        # 3. Create embeddings for each chunk
        # 4. Store in a vector database for retrieval
        
        # For this example, we'll just extract file extension and mock some processing
        file_extension = file_path.split('.')[-1].lower()
        
        extracted_text = ""
        if file_extension == 'txt':
            with open(file_path, 'r', encoding='utf-8') as file:
                extracted_text = file.read()
        elif file_extension == 'pdf':
            # In a real implementation, use a PDF library
            extracted_text = "Simulated PDF extraction"
        elif file_extension in ['doc', 'docx']:
            # In a real implementation, use a DOCX library
            extracted_text = "Simulated DOCX extraction"
        elif file_extension == 'csv':
            # In a real implementation, use pandas or similar
            extracted_text = "Simulated CSV extraction"
        elif file_extension == 'json':
            # Parse JSON
            with open(file_path, 'r', encoding='utf-8') as file:
                json_data = json.load(file)
                extracted_text = json.dumps(json_data, indent=2)
        
        # Create chunks (simplified)
        chunks = self._create_chunks(extracted_text)
        
        # Store chunks in database
        conn = sqlite3.connect('voiceai.db')
        for i, chunk in enumerate(chunks):
            conn.execute(
                """
                INSERT INTO knowledge_chunks
                (user_id, kb_name, chunk_index, chunk_text, file_path, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, kb_name, i, chunk, file_path, datetime.now().isoformat())
            )
        conn.commit()
        conn.close()
        
        return len(chunks)
    
    def _create_chunks(self, text, chunk_size=1000, overlap=100):
        """Split text into overlapping chunks"""
        if not text:
            return []
            
        # Simple chunking by character count
        chunks = []
        for i in range(0, len(text), chunk_size - overlap):
            chunk = text[i:i + chunk_size]
            if chunk:
                chunks.append(chunk)
                
        return chunks
    
    def search_knowledge(self, user_id, query, top_k=3):
        """Search knowledge base for relevant chunks"""
        # In a real implementation, this would use embeddings and vector search
        # For simplicity, we'll just do a basic text search
        
        conn = sqlite3.connect('voiceai.db')
        conn.row_factory = sqlite3.Row
        
        # Simple keyword matching (not efficient for real use)
        keywords = re.findall(r'\w+', query.lower())
        results = []
        
        for keyword in keywords:
            chunks = conn.execute(
                """
                SELECT * FROM knowledge_chunks
                WHERE user_id = ? AND chunk_text LIKE ?
                LIMIT ?
                """,
                (user_id, f"%{keyword}%", top_k)
            ).fetchall()
            
            for chunk in chunks:
                results.append({
                    'kb_name': chunk['kb_name'],
                    'chunk_text': chunk['chunk_text'],
                    'relevance': 1.0  # Simplified relevance score
                })
        
        conn.close()
        
        # Remove duplicates and sort by relevance
        unique_results = {}
        for result in results:
            key = result['chunk_text'][:100]  # Use start of text as a unique key
            if key not in unique_results or unique_results[key]['relevance'] < result['relevance']:
                unique_results[key] = result
                
        return list(unique_results.values())[:top_k]
