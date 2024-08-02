// const pcsclite = require('pcsclite');
// const fs = require('fs');
// const path = require('path');

import pcsclite from "pcsclite"
import fs from "fs"
import path from "path"

const CMD_SELECT_APP_JPN = Buffer.from([0x00, 0xA4, 0x04, 0x00, 0x0A, 0xA0, 0x00, 0x00, 0x00, 0x74, 0x4A, 0x50, 0x4E, 0x00, 0x10]);
const CMD_APP_RESPONSE = Buffer.from([0x00, 0xC0, 0x00, 0x00, 0x05]);
const CMD_SET_LENGTH = Buffer.from([0xC8, 0x32, 0x00, 0x00, 0x05, 0x08, 0x00, 0x00]);
const CMD_SELECT_FILE = Buffer.from([0xCC, 0x00, 0x00, 0x00, 0x08]);
const CMD_GET_DATA = Buffer.from([0xCC, 0x06, 0x00, 0x00]);
const fileLengths = [0, 459, 4011, 1227, 171, 43, 43, 0];
const RxBuffer = Buffer.alloc(256);
const TxBuffer = Buffer.alloc(64);

const DateString = (input) => {
  return `${input[0].toString(16).padStart(2, '0')}-${input[1].toString(16).padStart(2, '0')}-${input[2].toString(16).padStart(2, '0')}-${input[3].toString(16).padStart(2, '0')}`;
};

const PostcodeString = (input) => {
  return `${input[0].toString(16).padStart(2, '0')}${input[1].toString(16).padStart(2, '0')}${input[2].toString(16).padStart(1, '0')}`;
};

class TransmitObserver {
  constructor() {
    this.cards = [];
  }

  update(addedcards, removedcards) {
    addedcards.forEach(async (card) => {
      if (!this.cards.includes(card)) {
        this.cards.push(card);
        console.log(`+Inserted: ${card.atr.toString('hex')}`);
        
        try {
          await card.connect();
        } catch (error) {
          console.error(`Error connecting to the card: ${error}`);
          return;
        }

        try {
          const { response: RxBuffer, statusWord: [sw1, sw2] } = await card.transmit(CMD_SELECT_APP_JPN, 256);
          
          if (sw1 !== 0x61) {
            console.log('Not MyKad');
            return;
          }

          const CMD_APP_RESPONSE = Buffer.from([0x00, 0xC0, 0x00, 0x00, sw2]);
          const { response: RxBufferApp, statusWord: [sw1App, sw2App] } = await card.transmit(CMD_APP_RESPONSE, 256);

          for (let FileNum = 1; FileNum < fileLengths.length; FileNum++) {
            if (fileLengths[FileNum]) {
              console.log(`Reading JPN file ${FileNum}`);
              const out2file = FileNum === 2 ? fs.createWriteStream(path.join(__dirname, 'photo.jpg'), { flags: 'w+' }) : null;
              let split_length = 252;

              for (let split_offset = 0; split_offset < fileLengths[FileNum]; split_offset += split_length) {
                if (split_offset + split_length > fileLengths[FileNum]) {
                  split_length = fileLengths[FileNum] - split_offset;
                }

                const setLengthBuffer = Buffer.concat([CMD_SET_LENGTH.slice(0, 8), Buffer.from(split_length.toString(16).padStart(2, '0'), 'hex')]);
                await card.transmit(setLengthBuffer, 256);

                const selectFileBuffer = Buffer.concat([
                  CMD_SELECT_FILE.slice(0, 5),
                  Buffer.from(FileNum.toString(16).padStart(2, '0'), 'hex'),
                  Buffer.from((1).toString(16).padStart(2, '0'), 'hex'),
                  Buffer.from(split_offset.toString(16).padStart(2, '0'), 'hex'),
                  Buffer.from(split_length.toString(16).padStart(2, '0'), 'hex')
                ]);
                await card.transmit(selectFileBuffer, 256);

                const getDataBuffer = Buffer.concat([CMD_GET_DATA.slice(0, 4), Buffer.from(split_length.toString(16).padStart(1, '0'), 'hex')]);
                const { response: RxBufferData } = await card.transmit(getDataBuffer, 256);

                if (FileNum === 2 && out2file) {
                  if (split_offset === 0) {
                    out2file.write(RxBufferData.slice(3, 3 + 4000));
                  } else {
                    out2file.write(RxBufferData.slice(0, 4000));
                  }
                }

                if (FileNum === 1 && split_offset === 0) {
                  const name = RxBufferData.slice(3, 3 + 40).toString('ascii');
                  const jpn1_dict = {
                    name,
                    ic: RxBufferData.slice(273 - 252, 273 - 252 + 13).toString('ascii'),
                    sex: RxBufferData.slice(286 - 252, 286 - 252 + 1).toString('ascii'),
                    oldic: RxBufferData.slice(287 - 252, 287 - 252 + 8).toString('ascii'),
                    dob: DateString(RxBufferData.slice(295 - 252, 295 - 252 + 4)),
                    stateofbirth: RxBufferData.slice(299 - 252, 299 - 252 + 25).toString('ascii'),
                    validitydate: DateString(RxBufferData.slice(324 - 252, 324 - 252 + 4)),
                    nationality: RxBufferData.slice(328 - 252, 328 - 252 + 18).toString('ascii'),
                    ethnicrace: RxBufferData.slice(346 - 252, 346 - 252 + 25).toString('ascii'),
                    religion: RxBufferData.slice(371 - 252, 371 - 252 + 11).toString('ascii')
                  };
                  fs.writeFileSync(path.join(__dirname, 'jpn1.json'), JSON.stringify(jpn1_dict, null, 4));
                }

                if (FileNum === 4 && split_offset === 0) {
                  const jpn4_dict = {
                    line1: RxBufferData.slice(3, 3 + 30).toString('ascii'),
                    line2: RxBufferData.slice(33, 33 + 30).toString('ascii'),
                    line3: RxBufferData.slice(63, 63 + 30).toString('ascii'),
                    postcode: PostcodeString(RxBufferData.slice(93, 93 + 3)),
                    line5: RxBufferData.slice(96, 96 + 25).toString('ascii'),
                    line6: RxBufferData.slice(121, 121 + 30).toString('ascii'),
                    line7: RxBufferData.slice(151, 151 + 30).toString('ascii')
                  };
                  fs.writeFileSync(path.join(__dirname, 'jpn4.json'), JSON.stringify(jpn4_dict, null, 4));
                }
              }

              console.log('\nDone reading\n');
              if (out2file) {
                out2file.close();
              }
            }
          }
        } catch (error) {
          console.error(`Error transmitting command: ${error}`);
        }
      }
    });

    removedcards.forEach((card) => {
      console.log(`-Removed: ${card.atr.toString('hex')}`);
      const index = this.cards.indexOf(card);
      if (index !== -1) {
        this.cards.splice(index, 1);
      }
    });
  }
}

const pcsc = pcsclite();

pcsc.on('reader', (reader) => {
  console.log(`Reader detected: ${reader.name}`);

  const observer = new TransmitObserver();

  reader.on('status', (status) => {
    const changes = reader.state ^ status.state;
    if (changes) {
      if ((changes & reader.SCARD_STATE_EMPTY) && (status.state & reader.SCARD_STATE_EMPTY)) {
        observer.update([], [{ reader, atr: reader.atr }]);
      } else if ((changes & reader.SCARD_STATE_PRESENT) && (status.state & reader.SCARD_STATE_PRESENT)) {
        observer.update([{ reader, atr: reader.atr }], []);
      }
    }
  });

  reader.on('end', () => {
    console.log(`Reader removed: ${reader.name}`);
  });

  reader.on('error', (err) => {
    console.error(`Error (${reader.name}): ${err.message}`);
  });
});

pcsc.on('error', (err) => {
  console.error(`PCSC error: ${err.message}`);
});
