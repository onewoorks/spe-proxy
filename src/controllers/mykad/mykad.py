import json
import os, time

person = {
    "person": {
        "name": "IRWAN BIN IBRAHIM",
        "ic": "821021065515",
        "sex": "L",
        "oldic": "",
        "dob": "1982-10-21",
        "stateofbirth": "PAHANG",
        "validitydate": "2013-08-24",
        "nationality": "WARGANEGARA",
        "ethnicrace": "MELAYU",
        "religion": "ISLAM"
    },
    "address": {
        "line1": "NO 39-D",
        "line2": "JALAN KENANGA",
        "line3": "SURA JATI",
        "postcode": "23000",
        "line5": "DUNGUN",
        "line6": "TERENGGANU",
        "line7": "."
    }
}

# Create the file path
current_directory = os.getcwd()
filename = person['person']['ic'] + ".json"
file_path = os.path.join(current_directory, 'tmp', 'person',filename)


with open(file_path, 'w') as json_file:
    json.dump(person, json_file, indent=4)

# time.sleep(10)
print(json.dumps(person, indent=4))
# print("just error")