#!/usr/bin/env python3
"""
Script to evaluate detective accuracy by comparing actual culprits with AI guesses.
Uses GPT-4.1-mini to determine if the detective was correct.
"""

import os
import json
import re
import sys
import argparse
from pathlib import Path
from openai import OpenAI
from tqdm import tqdm

def extract_main_culprit(solution_text):
    """Extract text between <MAIN CULPRIT(S)> and </MAIN CULPRIT(S)> tags or after MAIN CULPRIT(S) line."""
    if not solution_text or not isinstance(solution_text, str):
        return None
    
    # First try XML format: <MAIN CULPRIT(S)>content</MAIN CULPRIT(S)>
    xml_pattern = r'<MAIN\s+CULPRIT\(S\)>(.*?)</MAIN\s+CULPRIT\(S\)>'
    match = re.search(xml_pattern, solution_text, re.DOTALL | re.IGNORECASE)
    
    if match:
        return match.group(1).strip()
    
    # If no XML format, try plain text format: MAIN CULPRIT(S)\ncontent
    # Look for "MAIN CULPRIT(S)" followed by content until next section or end
    plain_pattern = r'MAIN\s+CULPRIT\(S\)\s*\n(.*?)(?:\n\n[A-Z]|\n[A-Z][A-Z\s]*\(S\)|$)'
    match = re.search(plain_pattern, solution_text, re.DOTALL | re.IGNORECASE)
    
    if match:
        return match.group(1).strip()
    
    return None

def process_json_file(file_path, client):
    """Process a single JSON file."""
    print(f"Processing: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extract required fields
        original_metadata = data.get('original_metadata', {})
        detection = data.get('detection', {})
        
        gold_answer = original_metadata.get('correct_answer', '')
        suspects = original_metadata.get('answer_options', '')
        solution_text = detection.get('solution', '')
        
        # Extract Y from solution text
        predicted_answer = extract_main_culprit(solution_text)
        
        if not gold_answer:
            raise ValueError(f"  Warning: No answer found in puzzle_data")
            return False
            
        if not suspects:
            raise ValueError(f"  Warning: No answer_options found in puzzle_data")
            return False
            
        if not predicted_answer:
            print(f"  Warning: No MAIN CULPRIT(S) found in detection.solution")
            return False
        
        # Check if already processed
        #if 'correct?' in detection:
            #print(f"  Skipping: Already has 'correct?' field")
            #return False
        
        # Create prompt for GPT
        prompt = f"The following suspects were considered: {suspects}.\n The culprit was {gold_answer}. The detective guessed {predicted_answer}. Was the detective correct? Answer in one word: Yes/No -- Answer:"
        
        print(f"  Suspects: {suspects}")
        print(f"  Actual culprit: {gold_answer}")
        print(f"  Detective guess: {predicted_answer}")
        
        # Call GPT-4.1-mini
        try:
            response = client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=10,
                temperature=0
            )
            
            gpt_response = response.choices[0].message.content.strip()
            print(f"  GPT response: {gpt_response}")
            
            # Validate response
            if gpt_response not in ['Yes', 'No']:
                print(f"  Warning: Unexpected GPT response: {gpt_response}")
                # Try to extract Yes/No from response
                if 'yes' in gpt_response.lower():
                    gpt_response = 'Yes'
                elif 'no' in gpt_response.lower():
                    gpt_response = 'No'
                else:
                    print(f"  Error: Could not parse GPT response")
                    return False
            
            # Add the result to the JSON
            data['detection']['correct?'] = gpt_response
            
            # Write back to file
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"  ✅ Updated with: correct? = {gpt_response}")
            return True
            
        except Exception as e:
            print(f"  Error calling GPT: {e}")
            return False
            
    except json.JSONDecodeError as e:
        print(f"  Error parsing JSON: {e}")
        return False
    except Exception as e:
        print(f"  Error processing file: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Evaluate detective accuracy using GPT-4.1-mini')
    parser.add_argument('directory', help='Directory containing JSON files to process')
    parser.add_argument('--api-key', help='OpenAI API key (or set OPENAI_API_KEY env var)')
    parser.add_argument('--pattern', default='*.json', help='File pattern to match (default: *.json)')
    
    args = parser.parse_args()
    
    # Setup OpenAI client
    api_key = args.api_key or os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("Error: OpenAI API key required. Set OPENAI_API_KEY environment variable or use --api-key")
        sys.exit(1)
    
    client = OpenAI(api_key=api_key)
    
    # Find JSON files
    directory = Path(args.directory)
    if not directory.exists():
        print(f"Error: Directory {directory} does not exist")
        sys.exit(1)
    
    json_files = list(directory.glob(args.pattern))
    if not json_files:
        print(f"No files matching {args.pattern} found in {directory}")
        sys.exit(1)
    
    print(f"Found {len(json_files)} files to process")
    
    # Process each file
    successful = 0
    failed = 0
    
    # Use tqdm for progress tracking
    progress_bar = tqdm(json_files, desc="Processing files", unit="file")
    for file_path in progress_bar:
        if process_json_file(file_path, client):
            successful += 1
        else:
            failed += 1
        
        # Update progress bar description with current stats
        progress_bar.set_description(f"Processing files (✅{successful} ❌{failed})")
        print()  # Add blank line between files
    
    print(f"\n{'='*50}")
    print(f"✅ Successfully processed: {successful}")
    print(f"❌ Failed to process: {failed}")
    print(f"📊 Total files: {len(json_files)}")
    print(f"{'='*50}") 

if __name__ == "__main__":
    main() 