import './App.css'
import marblImg from './img/MARBL.png'
import axiboImg from './img/AXIBO.png'
import Selector from './UpdateSelector/selector'
import { useState } from 'react'
import { useEffect } from 'react'
import { queryDatabase } from './utils/firebase'
import { connect } from './utils/esptools/index'
import { sleep } from './utils/esptools/util'

let espStub
const baudRate = 115200
const bufferSize = 512
const measurementPeriodId = '0001'

let firmwareArr = []

function App() {
  const [firmwareList, updateList] = useState(null)
  const [selectedFirmware, updateSelectedFirmware] = useState(null)
  const [connected, toggleConnected] = useState(false)
  const [updating, toggleUpdating] = useState(false)

  const handleChange = (newSelection) => {
    updateSelectedFirmware(newSelection)
  }

  const downloadFirmware = async () => {
    firmwareArr = []
    let response = await fetch(selectedFirmware)
    let blob = await response.blob()
    var zip = require('jszip')()
    zip = await zip.loadAsync(blob)
    for (let filename in zip.files) {
      firmwareArr.push(zip.files[filename].async('blob'))
    }
  }

  const portScan = async () => {

    if (espStub) {
      await espStub.disconnect()
      await espStub.port.close()
      espStub = undefined
      toggleConnected(!connected)
      return
    }

    const esploader = await connect({
      log: (...args) => console.log(...args),
      debug: (...args) => console.debug(...args),
      error: (...args) => console.error(...args)
    })

    try {
      await esploader.initialize()

      console.log("Connected to " + esploader.chipName)
      
      espStub = await esploader.runStub()
      toggleConnected(!connected)
    } catch (err) {
      await esploader.disconnect()
      throw err
    }
  }
  
  const updateOrbit = async () => {
    if ((selectedFirmware !== null && selectedFirmware !== 'invalid') && connected) {
      toggleUpdating(!updating)
      downloadFirmware().then(() => {
        console.log('download and extraction complete')
        Promise.all(firmwareArr).then(async (data) => {
          let parsedFirmware = []
          for (let element in data) {
            if (data[element].size !== 0) {
              parsedFirmware.push(data[element])
            }
          }

          firmwareArr = parsedFirmware

          console.log('beginning flash process')

          let fileArr = []
          const BOOTLOADER_OFFSET = 0x1000
          const PARTITIONS_OFFSET = 0x8000
          const APP_OFFSET = 0xe000
          const FIRMWARE_OFFSET = 0x10000

          const blobToArrayBuffer = async (blob) => {
            return await blob.arrayBuffer()
          }

          for (var i = 0; i < 4; i++) {
            firmwareArr[i] = await blobToArrayBuffer(firmwareArr[i])
            console.log(firmwareArr[i])
          }
  
          fileArr.push({data: firmwareArr[1], address:BOOTLOADER_OFFSET})
          fileArr.push({data: firmwareArr[3], address: PARTITIONS_OFFSET})
          fileArr.push({data: firmwareArr[0], address: APP_OFFSET})
          fileArr.push({data: firmwareArr[2], address: FIRMWARE_OFFSET})

          console.log(fileArr)
          
          for (var i = 0; i < 4; i++) {
            try {
              await espStub.flashData(
                fileArr[i].data,
                (bytesWritten, totalBytes) => {
                  console.log(100*bytesWritten/totalBytes)
                },
                fileArr[i].address
              )
              await sleep(100)
            } catch (err) {
              console.error(err)
              toggleUpdating(!updating)
            }
          }
          console.log('Finished')
          toggleUpdating(false)
        })
      })

        
    } else if (!connected) {
      alert('Please connect to the Orbit')
    }else {
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
          <img className='marbl' src={marblImg}/>
          <Selector firmwareList={firmwareList} onChange={handleChange}/>
          <div className='buttonContainer'>
            <button className='button' onClick={portScan}>{connected ? "Connected" : "Connect"}</button>
            <button className='button' onClick={updateOrbit} disabled={updating}>{updating ? "Updating" : "Update"}</button>
          </div>
          <img className='axibo' src={axiboImg}/>
        </div>
      </div>
    </>
  )
}

export default App;
