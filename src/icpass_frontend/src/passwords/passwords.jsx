
import * as React from "react";
import { iccrypt_backend } from "../../../declarations/iccrypt_backend";

const Passwords = (props) => {

    const [name, setName] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [secrets, setSecrets] = React.useState([]);

    async function doGreet() {
        const greeting = await iccrypt_backend.greet(name);
        setMessage(greeting);
    }

    async function getAllSecrets() {
        const secrets = await iccrypt_backend.get_all_secrets();
        setSecrets(secrets);
        console.log("the secrets: ");
        console.log(secrets);
    }

    async function addTestSecrests() {
        let test_secret = {
            "id": "name of thisusername1www.super.com",
            "url": "www.super.com",
            "username": "username1",
            "password": "password1",
            "name": "name of this",
            "category": {
                "Password": null
            }
        };
        console.log("gonna add test secrets");
        await iccrypt_backend.add_test_secrets();
    }

    return (
        <div>

            {/* <input
                    id="name"
                    value={name}
                    onChange={(ev) => setName(ev.target.value)}
                ></input>
                <button style={{ marginLeft: 20 }} onClick={doGreet}>Get Greeting!</button> */}
            <button style={{ marginLeft: 20, marginRight: 32 }} onClick={getAllSecrets}>Get Secrets!</button>
            <button style={{ marginLeft: 20, marginRight: 32, marginTop: 10 }} onClick={addTestSecrests}>Add test secrets!</button>

            {/* <div>
                Greeting is: "
                <span>{message}</span>"
            </div> */}

            {/* <div>
                {JSON.stringify(secrets)}
            </div> */}

            {secrets.map((secret, index) => (
                <div key={index}>
                    {JSON.stringify(secret)}
                    +++++++++++++++++++++++++
                    {/* <span>name: {secret.name}</span>
                    <span>username: {secret.username}</span>
                    <span>pwd: {secret.password}</span> */}
                </div>
            ))}

        </div >
    );
};

export default Passwords;






