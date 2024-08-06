import ctypes
from smartcard.scard import *
from smartcard.util import *
from smartcard.Exceptions import NoCardException, CardConnectionException, CardServiceStoppedException
import json
from smartcard.CardMonitoring import CardMonitor, CardObserver
from time import sleep
import sys

CMD_SELECT_APP_JPN      = [0x00, 0xA4, 0x04, 0x00, 0x0A, 0xA0,0x00, 0x00, 0x00, 0x74, 0x4A, 0x50, 0x4E, 0x00, 0x10]
CMD_APP_RESPONSE        = [0x00, 0xC0, 0x00, 0x00, 0x05]
CMD_SET_LENGTH          = [0xC8, 0x32, 0x00, 0x00, 0x05, 0x08, 0x00, 0x00]
CMD_SELECT_FILE         = [0xCC, 0x00, 0x00, 0x00, 0x08]
CMD_GET_DATA            = [0xCC, 0x06, 0x00, 0x00]
fileLengths             = [0, 459, 4011, 1227, 171, 43, 43, 0]
RxBuffer = bytearray(256)
TxBuffer = bytearray(64)
dLength = 256

# YYYY-MM-DD format
def DateString(out, in_):
    out[0:2] = "{:02x}".format(in_[0])
    out[2:5] = "{:02x}-".format(in_[1])
    out[5:8] = "{:02x}-".format(in_[2])
    out[8:10] = "{:02x}".format(in_[3])
    out[10:] = ''
    return out

# 5 digit postcode format
def PostcodeString(in_):
    postcode = ("{:02x}{:02x}{:01x}".format(*in_))
    return (postcode)

# Observe card insertion and removal


class transmitobserver(CardObserver):

    def __init__(self):
        self.cards = []

    def update(self, observable, actions):
        (addedcards, removedcards) = actions
        for card in addedcards:
            if card not in self.cards:
                self.cards += [card]
                #print("+Inserted: ", toHexString(card.atr))
                try:
                    card.connection = card.createConnection()
                    card.connection.connect()

                except CardConnectionException as e:
                    print(f"Error connecting to the card: {e}")
                except NoCardException:

                    print("Smart card not connected")

            # select JPN application
            try:
                RxBuffer, sw1, sw2 = card.connection.transmit(
                    CMD_SELECT_APP_JPN)
            except CardServiceStoppedException as e:
                print(f"Error sending the SELECT_JPN command: {e}")

            # check response
            if sw1 != 0x61:
                print("Not MyKad")

            # app response
            CMD_APP_RESPONSE = [0x00, 0xC0, 0x00, 0x00, sw2]
            try:
                RxBuffer, sw1, sw2 = card.connection.transmit(CMD_APP_RESPONSE)
            except CardServiceStoppedException as e:
                print(f"Error sending the GET_RESPONSE command: {e}")

            # check response
            person = {}
            for FileNum in range(1, len(fileLengths)):
                
                if fileLengths[FileNum]:
                    #print("Reading JPN file {}".format(FileNum))
                    if (FileNum == 2):
                        continue
                        out2file = open("photo.jpg", "wb+")
                    split_length = 252
                    split_offset = 0
                    for split_offset in range(0, fileLengths[FileNum], split_length):
                        #print(".", end="")
                        if split_offset + split_length > fileLengths[FileNum]:
                            split_length = fileLengths[FileNum] - split_offset
                        # set length
                        TxBuffer = bytearray(CMD_SET_LENGTH[:8])
                        TxBuffer += split_length.to_bytes(2,byteorder='little')
                        try:
                            RxBuffer, sw1, sw2 = card.connection.transmit(
                                list(TxBuffer))
                        except CardServiceStoppedException as e:
                            print(f"Error sending the SET_LENGTH command: {e}")

                        # select file
                        one = 1
                        TxBuffer = bytearray(CMD_SELECT_FILE[:5])
                        TxBuffer += FileNum.to_bytes(2, byteorder='little')
                        TxBuffer += one.to_bytes(2, byteorder='little')
                        TxBuffer += split_offset.to_bytes(2,byteorder='little')
                        TxBuffer += split_length.to_bytes(2,byteorder='little')
                        try:
                            RxBuffer, sw1, sw2 = card.connection.transmit(
                                list(TxBuffer))
                        except CardServiceStoppedException as e:
                            print(f"Error sending the SELECT_FILE command: {e}")

                        # get RxBuffer
                        TxBuffer = bytearray(CMD_GET_DATA[:4])
                        TxBuffer += split_length.to_bytes(1,byteorder='little')
                        try:
                            RxBuffer, sw1, sw2 = card.connection.transmit(
                                list(TxBuffer))
                        except CardServiceStoppedException as e:
                            print(f"Error sending the GET_DATA command: {e}")
                        RxBuffer = bytes(RxBuffer)
                        if FileNum == 2:
                            if split_offset == 0:
                                out2file.write(RxBuffer[3:3+4000])
                            else:
                                out2file.write(RxBuffer[:4000])

                        # Write RxBuffer to txt file
                        if FileNum == 1 and split_offset == 0:
                            name = toASCIIString(list(RxBuffer)[3:3+40])

                        elif FileNum == 1 and split_offset == 252:
                            DOB = DateString(list(TxBuffer), list(RxBuffer)[295-252:295-252+4])
                            ValidityDate = DateString(list(TxBuffer), list(RxBuffer)[324-252:324-252+4])
                            jpn1_dict = {
                                "name": name,
                                "ic": toASCIIString(list(RxBuffer)[273-252:273-252+13]).strip(),
                                "sex": toASCIIString(list(RxBuffer)[286-252:286-252+1]).strip(),
                                "oldic": toASCIIString(list(RxBuffer)[287-252:287-252+8]).strip(),
                                "dob": ''.join(DOB),
                                "stateofbirth": toASCIIString(list(RxBuffer)[299-252:299-252+25]).strip(),
                                "validitydate": ''.join(ValidityDate).strip(),
                                "nationality": toASCIIString(list(RxBuffer)[328-252:328-252+18]).strip(),
                                "ethnicrace": toASCIIString(list(RxBuffer)[346-252:346-252+25]).strip(),
                                "religion": toASCIIString(list(RxBuffer)[371-252:371-252+11]).strip()
                            }

                            person["person"] = jpn1_dict

                        elif FileNum == 4 and split_offset == 0:
                            postcode = PostcodeString(list(RxBuffer)[93:93+3])
                            jpn4_dict = {
                                "line1": toASCIIString(list(RxBuffer)[3:3+30]).strip(),
                                "line2": toASCIIString(list(RxBuffer)[33:33+30]).strip(),
                                "line3": toASCIIString(list(RxBuffer)[63:63+30]).strip(),
                                "postcode": postcode,
                                "line5": toASCIIString(list(RxBuffer)[96:96+25]).strip(),
                                "line6": toASCIIString(list(RxBuffer)[121:121+30]).strip(),
                                "line7": toASCIIString(list(RxBuffer)[151:151+30]).strip()
                            }
                            person["address"] = jpn4_dict

                    #print("\nDone reading")
                    if FileNum == 2:
                        out2file.close()        

                    if FileNum == 6:
                        #print("Selesai read mykad")
                        person_object = json.dumps(person, indent=4)
                        personfile = open("person.json", "w+")
                        personfile.write(person_object)
                        personfile.close()
                        print(person_object)
                        sys.exit(0)
                        
                        


if __name__ == '__main__':
    try:
        # print("Insert or remove a SIM card in the system.")
        # print("This program will exit in 5 minutes")
        # print("")
        cardmonitor = CardMonitor()
        cardobserver = transmitobserver()
        cardmonitor.addObserver(cardobserver)
        sleep(6)
        print(person_object)
        cardmonitor.deleteObserver(cardobserver)
    # all errors are caught here
    except Exception as e:
        exit()
