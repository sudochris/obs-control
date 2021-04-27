
class OBSApplication {
    constructor() {
        this.connected = false;
        this.obs = new OBSWebSocket();
        this.availableScenes = [];

        this.obs.on('error', err => { Notify.error(err.error); });

        // Switched to Scene in OBS
        this.obs.on("SwitchScenes", data => { this.highlightScene(data.sceneName); });

        // ScenesChanged in OBS: Add or remove scene
        this.obs.on("ScenesChanged", data => {
            let scenesInObs = data.scenes.map((i) => i.name)

            let newScenes = scenesInObs.filter(x => !this.availableScenes.includes(x));
            let removedScenes = this.availableScenes.filter(x => !scenesInObs.includes(x));

            removedScenes.forEach((sceneName) => this.removeScene(sceneName));
            newScenes.forEach((sceneName) => this.registerScene(sceneName));
        });

        
    }

    connect() {
        if(!this.connected) {
            let ip = $("#hostIp").val() || "localhost";
            let port = $("#hostPort").val() || 4444;
            let password = $("#hostPassword").val() || "";
            let hostAddress = `${ip}:${port}`;
            console.log(ip);
            console.log(port);
            console.log(password);
            this.obs.connect({
                address: hostAddress,
                password: password
            }).then(() => {
                this.connected = true;
                this.availableScenes = [];
                Notify.success("Connection established!");
                
                let saveConfig = $("#rememberConfig").prop("checked");
                if(saveConfig) {
                    localStorage.setItem("last_ip", ip);
                    localStorage.setItem("last_port", port);
                    localStorage.setItem("last_password", password);
                    localStorage.setItem("last_remember", saveConfig);
                } else {
                    localStorage.removeItem('last_ip');
                    localStorage.removeItem('last_port');
                    localStorage.removeItem('last_password');
                    localStorage.removeItem('last_remember');
                }

                $("#connection").removeAttr("open");
                return this.obs.send("GetSceneList");
            }).then(data => {
                for(let sceneIdx in data.scenes) {
                    let sceneObject = data.scenes[sceneIdx];
                    let sceneName = sceneObject.name;
                    this.registerScene(sceneName);
                }
                this.highlightScene(data.currentScene);
                
/*                this.obs.sendCallback('GetStats', {}, (err, data) => {
                    console.log(data);
                }); // no return value*/
            }).catch(err => {
                Notify.error(err.error);
            });
        } else {
            Notify.error("Already connected...");
        }
    }

    registerScene(sceneName) {
        let sceneId = this.sceneIdFromName(sceneName);
        this.availableScenes.push(sceneId);
        let test = $('<button/>', {
            text: sceneName,
            id: sceneId,
            class: "sceneButton pure-button",
            click: function () { 
                app.switchToScene(sceneName);
             }
        });
        
        $("#scenesList").append(test);
    }

    sceneIdFromName(sceneName) {
        return sceneName.replaceAll(" ", "_").toUpperCase();
    }

    removeScene(sceneName) {
        let sceneId = this.sceneIdFromName(sceneName);
        this.availableScenes = arrayRemove(this.availableScenes, sceneId);
        $("#" + sceneId).remove();
    }

    switchToScene(sceneName) {
        if(this.connected) {
            this.obs.send('SetCurrentScene', {
                'scene-name': sceneName
            });
            this.highlightScene(sceneName);
        }
    }

    highlightScene(sceneName) {
        let sceneId = this.sceneIdFromName(sceneName);
        $("#scenesList").children().removeClass("active");
        $("#" + sceneId).addClass("active");
    }

    disconnect() {
        if(this.connected) {
            this.obs.disconnect();
            this.connected = false;
            $("#scenesList").empty();
        } else {
            Notify.error("Not connected...");
        }
    }

}

let app = new OBSApplication();

let lastIp = localStorage.getItem("last_ip");
let lastPort = localStorage.getItem("last_port");
let lastPassword = localStorage.getItem("last_password");
let lastRemember = localStorage.getItem("last_remember");

if(lastIp) $("#hostIp").val(lastIp);
if(lastPort) $("#hostPort").val(lastPort);
if(lastPassword) $("#hostPassword").val(lastPassword);
if(lastRemember === "true") $("#rememberConfig").prop('checked', true);
