import './App.css'
import marblImg from './img/MARBL.png'
import axiboImg from './img/AXIBO.png'
import Selector from './UpdateSelector/selector'
import ProgressBar from './ProgressBar/ProgressBar'
import { useState } from 'react'
import { useEffect } from 'react'
import { queryDatabase } from './utils/firebase'
import { connect } from './utils/esptools/index'
import { sleep } from './utils/esptools/util'

let espStub
let firmwareArr = []

function App() {
  const [firmwareList, updateList] = useState(null)
  const [selectedFirmware, updateSelectedFirmware] = useState(null)
  const [connected, toggleConnected] = useState(false)
  const [updating, toggleUpdating] = useState(false)
  const [fileCount, updateFileCount] = useState(0)
  const [totalFiles, updateTotalFiles] = useState(0)
  const [percent, updatePercent] = useState('0')
  const [scanCSS, updateScanCSS] = useState('button is-info')
  const [updateCSS, updateUpdateCSS] = useState('button is-success')

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
      updateScanCSS('button is-info')
      return
    }

    const esploader = await connect({
      log: (...args) => console.log(...args),
      debug: (...args) => console.debug(...args),
      error: (...args) => console.error(...args)
    })

    try {
      updateScanCSS('button is-info is-loading')
      await esploader.initialize()

      console.log("Connected to " + esploader.chipName)
      
      espStub = await esploader.runStub()
      toggleConnected(!connected)
      updateScanCSS('button is-info')
    } catch (err) {
      await esploader.disconnect()
      updateScanCSS('button is-info is-danger')
      alert('Error connecting to Orbit')
      throw err
    }
  }
  
  const updateOrbit = async () => {
    if ((selectedFirmware !== null && selectedFirmware !== 'invalid') && connected && espStub) {
      toggleUpdating(!updating)
      updateUpdateCSS('button is-success is-loading')
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

          updateTotalFiles(firmwareArr.length)

          for (let i = 0; i < firmwareArr.length; i++) {
            firmwareArr[i] = await blobToArrayBuffer(firmwareArr[i])
          }

          if (firmwareArr.length === 1) {
            fileArr.push( {data: firmwareArr[0], address: 0x000000})
          } else if (firmwareArr.length === 4) {
            fileArr.push({data: firmwareArr[1], address:BOOTLOADER_OFFSET})
            fileArr.push({data: firmwareArr[3], address: PARTITIONS_OFFSET})
            fileArr.push({data: firmwareArr[0], address: APP_OFFSET})
            fileArr.push({data: firmwareArr[2], address: FIRMWARE_OFFSET})
          }
          
          for (let i = 0; i < firmwareArr.length; i++) {
            updateFileCount(i + 1)
            updatePercent('0')
            try {
              await espStub.flashData(
                fileArr[i].data,
                (bytesWritten, totalBytes) => {
                  var progress = 100*bytesWritten/totalBytes
                  updatePercent(progress.toString())
                },
                fileArr[i].address
              )
              await sleep(100)
            } catch (err) {
              console.error(err)
              toggleUpdating(!updating)
              updateUpdateCSS('button is-danger')
            }
          }
          await espStub.disconnect()
          await espStub.port.close()
          espStub = undefined
          toggleConnected(!connected)
          
          console.log('Finished')
          toggleUpdating(false)
          updateUpdateCSS('button is-success')
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
          <img className='marbl' src={marblImg} alt='Marbl Orbit'/>
          <Selector firmwareList={firmwareList} onChange={handleChange}/>
          <div className='buttonContainer'>
            <button className={scanCSS} onClick={portScan}>{connected ? "Connected" : "Connect"}</button>
            <button className={updateCSS} onClick={updateOrbit} disabled={updating}>{updating ? "Updating" : "Update"}</button>
          </div>
          <ProgressBar updating={updating} completion={percent} fileCount={fileCount} totalFiles={totalFiles}></ProgressBar>
          <img className='axibo' src={axiboImg} alt='Powered by Axibo'/>
        </div>
      </div>
    </>
  )
}

export default App;
