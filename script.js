let ws;
const serverUrl = window.location.hostname.includes("ngrok.io") ? `wss://${window.location.hostname}` : "ws://localhost:8000";

function connectWebSocket() {
    ws = new WebSocket(serverUrl);

    ws.onopen = () => console.log("WebSocket 연결 성공!");

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.avatars) {
            avatars = data.avatars;
            renderAvatars();
        }

        if (data.message) {
            const chatBox = document.getElementById("chat-box");
            const newMessage = document.createElement("div");
            newMessage.textContent = data.message;
            chatBox.appendChild(newMessage);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    };

    ws.onclose = () => {
        console.error("WebSocket 연결 종료됨. 재연결 시도...");
        setTimeout(connectWebSocket, 3000);
    };
}

connectWebSocket();

const canvas = document.getElementById("avatarCanvas");
const ctx = canvas.getContext("2d");
let avatars = {};

const background = new Image();
background.src = "background.png";

const images = { male: new Image(), female: new Image() };
images.male.src = "player.png";
images.female.src = "player0.png";

function renderAvatars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    for (const id in avatars) {
        const avatar = avatars[id];
        const image = avatar.gender === "male" ? images.male : images.female;
        ctx.drawImage(image, avatar.x, avatar.y, 40, 40);

        // ✅ 아바타 아래에 사용자 이름 올바르게 표시
        ctx.fillStyle = "black";  
        ctx.font = "14px Arial";  
        ctx.textAlign = "center"; 
        ctx.fillText(avatar.username ?? "익명", avatar.x + 20, avatar.y + 50);  
    }
}

// ✅ Enter 키로 채팅 전송 기능 추가
document.getElementById("message").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault(); 
        sendMessage();
    }
});

function setUsername() {
    const username = document.getElementById("username").value;

    if (username.trim() !== "") {
        document.getElementById("name-selection").style.display = "none";
        document.getElementById("gender-selection").style.display = "block";

        ws.send(JSON.stringify({ username }));
    }
}

function selectGender(gender) {
    ws.send(JSON.stringify({ gender }));

    document.getElementById("gender-selection").style.display = "none";
    document.getElementById("main-container").style.display = "flex";
}

function sendMessage() {
    const messageInput = document.getElementById("message");
    const message = messageInput.value.trim();

    if (message !== "") {
        ws.send(JSON.stringify({ message }));
        messageInput.value = "";

        // ✅ 채팅창이 최하단으로 이동하며, 입력 칸도 항상 보이게 설정
        const chatBox = document.getElementById("chat-box");
        setTimeout(() => {
            chatBox.scrollTop = chatBox.scrollHeight; // 채팅창을 최하단으로 이동
        }, 100);
    }
}






// ✅ 키보드 입력으로 아바타 이동 기능 추가
document.addEventListener("keydown", (event) => {
    let dx = 0, dy = 0;

    switch (event.key) {
        case "ArrowUp":
        case "w":
            dy = -10;
            break;
        case "ArrowDown":
        case "s":
            dy = 10;
            break;
        case "ArrowLeft":
        case "a":
            dx = -10;
            break;
        case "ArrowRight":
        case "d":
            dx = 10;
            break;
        default:
            return;
    }

    ws.send(JSON.stringify({ dx, dy }));
});
