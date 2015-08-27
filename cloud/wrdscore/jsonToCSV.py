# Script to convert 250K WrdEntry dictionary from JSON
# to CSV with only word, dictionary id, and complexity score
# Load to Parse database in WrdScore object.
# $ python jsonToCsv.py WrdEntry.json WrdEntry.csv

import sys
import json

json_file = sys.argv[1]

file_data = open(json_file)
data = json.load(file_data)

out_data = "word,wordEntryId,complexity\n"

for entry in data:
    complexity = len(entry['word']) - 3
    scoreEntry =  entry['word'] + "," + entry['objectId'] +"," + str(complexity) +"\n"
    out_data += scoreEntry

with open(sys.argv[2], "w") as out_file:
    out_file.write(out_data)
