// https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API
// https://medium.com/jeremy-gottfrieds-tech-blog/javascript-tutorial-record-audio-and-encode-it-to-mp3-2eedcd466e78
//
const record = document.querySelector('.record');
const clips = document.querySelector('.clips');

let state = 0;

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia supported.");
  navigator.mediaDevices
    .getUserMedia(
      // constraints - only audio needed for this app
      {
        audio: true,
      }
    )

    // Success callback
    .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        record.onclick = () => {
            if (state === 0) {
                mediaRecorder.start();
                state = 1;
                record.textContent = "Stop Recording"
            } else if (state === 1) {
                state = 2;
                mediaRecorder.stop();
                record.style.display = "none";
            }
        }

        let chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            chunks.push(e.data);
        }

        mediaRecorder.onstop = (e) => {
            state = 2;
            const blob = new Blob(chunks, { type: "audio/webm" });

            const audio = document.createElement("audio");
            audio.setAttribute("controls", "");
            const audio_url = window.URL.createObjectURL(blob);
            audio.src = audio_url;
            
            const sendbtn = document.createElement("button");
            sendbtn.innerHTML = "Send";

            sendbtn.onclick = (e) => {
                // fetch api madness
                const formdata = new FormData();

                formdata.append("content", blob);

                fetch("http://localhost:3000/create", {
                    method: "POST",
                    body: formdata
                }).then(response => response.text())
                    .then(text => {
                        while (clips.lastChild) {
                            clips.removeChild(clips.lastChild);
                        }
                        chunks = [];

                        document.querySelector("#output").value = window.location.href + "audio/" + text;
                        document.querySelector("#output-div").setAttribute("style", "");
                });

            }

            clips.appendChild(audio);
            clips.appendChild(sendbtn);
        }
    })

    // Error callback
    .catch((err) => {
      console.error(`The following getUserMedia error occurred: ${err}`);
    });
} else {
  console.log("getUserMedia not supported on your browser!");
}

function copyfn() {
  // Get the text field
  var copyText = document.getElementById("output");

  // Select the text field
  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices

   // Copy the text inside the text field
  navigator.clipboard.writeText(copyText.value);
}
