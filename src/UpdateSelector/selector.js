import { useEffect, useState } from 'react'
import './selector.css'

function Selector(props) {
    const [firmwareList, setList] = useState([])

    const handleChange = (event) => {
        props.onChange(event.target.value)
    }

    useEffect(() => {
        if (props.firmwareList != null) {
            var listElements = Object.values(props.firmwareList)
            setList(listElements)
        }
    }, [props.firmwareList])

    return(
        <>
            <select className='select' id='firmwareVersion' onChange={handleChange} defaultValue={'Select a Version'}>
                {firmwareList.map((version) => <option key={version.name} value={version.data.link}>{version.name}</option>)}
                <option value={'custom_version'}>Custom</option>
            </select>
        </>
    )
}

export default Selector;
