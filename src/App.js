import './App.css'
import Selector from './UpdateSelector/selector'
import { useState } from 'react'
import { useEffect } from 'react'
import { queryDatabase } from './utils/firebase'
import { Transport } from './utils/webserial'
import { ESPLoader } from './utils/ESPLoader'

let device = null
let transport
let chip = 'default'
let esploader
let connected = false
let firmwareArr = []

function App() {
  const [firmwareList, updateList] = useState(null)
  const [selectedFirmware, updateSelectedFirmware] = useState(null)

  const handleChange = (newSelection) => {
    updateSelectedFirmware(newSelection)
  }

  const downloadFirmware = async () => {
    fetch(selectedFirmware).then((response) => {
      response.blob().then((blob) => {
        var zip = require('jszip')()
        zip.loadAsync(blob).then((zip) => {
          Object.keys(zip.files).forEach((filename) => {
            zip.files[filename].async('text').then((fileData) => {
              if (fileData !== "") {
                firmwareArr.push(fileData)
              }
            })
          })
        })
      })
    })
  }

  const portScan = async () => {
    if (device === null) {
      device = await navigator.serial.requestPort({
        filters: [{usbVendorId: 0x10c4}]
      })
      transport = new Transport(device)
      console.log(transport)
    }
    
    try {
      esploader = new ESPLoader(transport, 115200)
      connected = true
      chip = await esploader.main_fn()
      
      await esploader.flash_id()
    } catch(e) {
      console.log(e)
    }
  }
  
  const updateOrbit = async () => {
    if (selectedFirmware !== null && connected) {
      downloadFirmware().then(() => {
        console.log('beginning flash process')

        let fileArr = []
        const BOOTLOADER_OFFSET = 0x1000
        const PARTITIONS_OFFSET = 0x8000
        const APP_OFFSET = 0xe000
        const FIRMWARE_OFFSET = 0x10000

        fileArr.push({data: firmwareArr[1], address:BOOTLOADER_OFFSET})
        fileArr.push({data: firmwareArr[3], address: PARTITIONS_OFFSET})
        fileArr.push({data: firmwareArr[0], address: APP_OFFSET})
        fileArr.push({data: firmwareArr[2], address: FIRMWARE_OFFSET})

        esploader.write_flash({fileArray: fileArr, flash_size: 'keep'})
      })
    } else if (!connected) {
      alert('Please connect to the Orbit!')
    } else {
      alert('Please select a firmware version!')
    }
  }

  useEffect(() => {
    queryDatabase().then((data) => {
      updateList(data)
    }).catch((err) => {
      console.log(err)
    })
  }, [])

  return (
    <>
      <div className='background'>
        <div className='selector'>
          <Selector firmwareList={firmwareList} onChange={handleChange}/>
          <div className='buttonContainer'>
            <button className='button' onClick={portScan}>Refresh</button>
            <button className='button' onClick={updateOrbit}>Update</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default App;
