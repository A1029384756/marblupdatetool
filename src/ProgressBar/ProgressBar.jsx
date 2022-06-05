import './ProgressBar.css'
import { useState } from "react";

function ProgressBar(props) {
    const [completion, setCompletion] = useState(0)

    if (!props.updating) return null;

    return(
        <>
            <div className='progressContainer'>
                <progress className="progress is-info" value={props.completion} max="100"></progress>
                <div className='labelTxt'>File {props.fileCount} of 4</div>
            </div>
        </>
    )
}

export default ProgressBar;