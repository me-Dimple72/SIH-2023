import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import ScrollToBottom from "react-scroll-to-bottom";
import { FaPaperPlane, FaSearch, FaUserCircle } from "react-icons/fa";
import { BsChatDotsFill } from "react-icons/bs";

const socket = io("http://localhost:4000");

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [usersInRoom, setUsersInRoom] = useState([username]);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };

      await axios.post("http://localhost:4000/messages", messageData);

      await new Promise((resolve) => {
        socket.emit("send_message", messageData, resolve);
        // console.log("message sent event ")
        setCurrentMessage("");
      });
    }
  };

  // const sound = useMemo(()=> new Audio('./notifications.mp3'),[])

  const receiveMessageHandler = (data) => {
    setMessageList((prevList) => [...prevList, data]);
    // sound.play()
    console.log("event receive message init");
  };

  useEffect(() => {
    axios
      .get(`http://localhost:4000/messages/${room}`)
      .then((response) => {
        setMessageList(response.data);
      })
      .catch((error) => {
        console.error("Error retrieving chat history:", error);
      });

    socket.on("receive_message", receiveMessageHandler);

    socket.on("user_entered", (data) => {
      setUsersInRoom((users) => {
        if (!users.includes(data)) {
          return [...users, data];
        }
        return users;
      });
    });

    socket.on("users_in_room", (users) => {
      setUsersInRoom(users);
    });

    socket.emit("join_room", { room, username });

    return () => {
      socket.off("receive_message", receiveMessageHandler);
      socket.off("user_entered");
    };
  }, [room, username]);

  return (
    <>
      <div className="leftblock">
        <div className="friendlist">
          <input
            type="text"
            placeholder="Search for other patients"
            style={{
              marginLeft: "17px",
              height: "40px",
              width: "17rem",
              padding: "10px",
              paddingLeft: "40px",
              fontSize: "20px",
              borderRadius: "10px",
            }}
          />
          <FaSearch
            style={{ marginLeft: "-460px", fontSize: "20px", color: "#999" }}
          />

          {usersInRoom.map((user, index) => (
            <div
              key={index}
              className={username === user ? "G2 currentUser" : "G2"}
            >
              <FaUserCircle style={{ fontSize: "40px", marginRight: "10px" }} />
              {user}
            </div>
          ))}

          {usersInRoom.length > 1 && (
            <div className="G2">
              {`${usersInRoom.length - 1} Other User${
                usersInRoom.length - 1 > 1 ? "s" : ""
              } online`}
            </div>
          )}
        </div>
      </div>

      <div className="chat-window">
        <div className="chat-header">
          <p>
            <BsChatDotsFill
              style={{ color: "white", fontSize: "30px", marginRight: "10px" }}
            />
            Live Chat
          </p>
        </div>
        <div className="chat-body">
          <ScrollToBottom className="message-container">
            {messageList.map((messageContent) => {
              return (
                <div
                  className="message"
                  id={username === messageContent.author ? "other" : "you"}
                >
                  <div>
                    <div className="message-content">
                      <p>{messageContent.message}</p>
                    </div>
                    <div className="message-meta">
                      <div id="time">{messageContent.time}</div>
                      <p id="author">{messageContent.author}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="chat-footer">
              <input
                type="text"
                value={currentMessage}
                placeholder="Type your message"
                onChange={(e) => {
                  setCurrentMessage(e.target.value);
                }}
                onKeyPress={(e) => {
                  e.key === "Enter" && sendMessage();
                }}
              />
              <button onClick={sendMessage}>
                <FaPaperPlane />
              </button>
            </div>
          </ScrollToBottom>
        </div>
      </div>
    </>
  );
}

export default Chat;
