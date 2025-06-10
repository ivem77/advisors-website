import csv
import json
import re

# Mapping of US state names to their two-letter postal abbreviations
STATE_ABBREV = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
}


def slugify(city: str, state: str) -> str:
    """
    Generate a slug from city name and state name using lowercase, hyphens, and state postal code.
    """
    # Normalize city: remove non-alphanumeric, replace spaces with hyphens
    city_slug = re.sub(r"[^a-z0-9]+", '-', city.lower()).strip('-')
    # Lookup state abbreviation, default to lowercased full name if not found
    state_code = STATE_ABBREV.get(state, state).lower()
    return f"{city_slug}-{state_code}"


def transform(input_file: str, output_file: str):
    # Read all lines and find the CSV header row
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    header_idx = next(i for i, line in enumerate(lines) if line.strip().startswith('rank,'))
    reader = csv.DictReader(lines[header_idx:])

    output = []
    for row in reader:
        try:
            name = row['city']
            state = row['state']
            # Remove commas from population and convert to int
            population = int(row['population'].replace(',', ''))
        except (KeyError, ValueError):
            # Skip rows that don't parse correctly
            continue

        output.append({
            'name': name,
            'state': state,
            'slug': slugify(name, state),
            'population': population,
            'priority': 1
        })

    # Write the JSON output
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Transform city CSV data to JSON')
    parser.add_argument('input', help='Path to the input text file')
    parser.add_argument('output', help='Path for the output JSON file')
    args = parser.parse_args()

    transform(args.input, args.output)
