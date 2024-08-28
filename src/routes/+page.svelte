<script>
  import "../components/LuaScript.svelte";
  import {initlua} from "../lib/lua.js";
  let activeTab = "browser";
  let url = "weblua/test";
  let history = [url];
  let currentIndex = 0;

  function handleTabClick(tab) {
    activeTab = tab;
  }

  function goBack() {
    if (currentIndex > 0) {
      currentIndex--;
      url = history[currentIndex];
    }
  }

  function goForward() {
    if (currentIndex < history.length - 1) {
      currentIndex++;
      url = history[currentIndex];
    }
  }
  function pushUrl(url) {
    let div = document.getElementsByClassName("browser-content")[0];
    let l = initlua()
    if (url.startsWith("weblua/")) {
      url = url.split("/")
      if (!url[1].endsWith(".lua")) {
        url[1] = url[1] + ".lua"
      }
      //alert(url)
      let code = fetch(url[1]).then(response => response.text()).then(code => {;
      //alert(code)
      div.replaceChildren()
      l.parse(code).exec()})
    }
  }
  function navigateToUrl(e) {
    //alert(e.keyCode === 13)
    if ((e.keyCode ? e.keyCode : e.which) === 13) {
      if (url.startsWith("weblua/")) {
        history.push(url);
        currentIndex = history.length - 1;
        //alert(url);
        pushUrl(url)
      } else {
        alert("Invalid URL");
      }
    }
  }
</script>

<main>
  <div class="tabs">
    <ul>
      <li class:active={activeTab === "browser"}>
        <button on:click={() => handleTabClick("browser")}>Browser</button>
      </li>
      <li class:active={activeTab === "editor"}>
        <button on:click={() => handleTabClick("editor")}>Editor</button>
      </li>
      <li class:active={activeTab === "servers"}>
        <button on:click={() => handleTabClick("servers")}>Servers</button>
      </li>
    </ul>

    <div class="tab-content">
      {#if activeTab === "browser"}
        <div>
          <div class="browser-controls">
            <button on:click={goBack} disabled={currentIndex === 0}>🠰</button>
            <button
              on:click={goForward}
              disabled={currentIndex === history.length - 1}>🠲</button
            >
            <input
              type="text"
              bind:value={url}
              on:keyup={(e) => navigateToUrl(e)}
              class="url-input"
            />
          </div>
          <div class="browser-content">
            <!-- Render the browser content here -->
          </div>
        </div>
      {:else if activeTab === "editor"}
        <div>
          <p>this will be the editor</p>
        </div>
      {:else if activeTab === "servers"}
        <div>
          <p>this will be the server list</p>
        </div>
      {/if}
    </div>
  </div>

  <style>
    body {
      background-color: white;
    }
    .tabs {
      display: flex;
      flex-direction: column;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      gap: 10px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #ddd;
    }

    li {
      flex: 1;
      text-align: center;
    }

    button {
      background-color: transparent;
      border: none;
      padding: 10px;
      width: 100%;
      cursor: pointer;
      text-align: center;
    }

    .active button {
      background-color: #ddd;
    }

    .tab-content {
      padding: 20px;
    }

    .browser-controls {
      display: flex;
      /*align-items: center;*/
      gap: 10px;
      /*position: sticky;*/
      top: 0;
      background-color: #f5f5f5;
      padding: 10px;
    }
    .browser-controls button {
      padding: 5px;
      color: #000;
      background-color: #ddd;
      width: 10%;
      /*margin: 5px;*/
    }
    .url-input {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 1000vw;
      /*box-sizing: border-box;*/
    }
  </style>
</main>
