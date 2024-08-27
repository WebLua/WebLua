<script>
  import "./components/LuaScript.svelte";
  let activeTab = 'browser';
  function handleTabClick(tab) {
      activeTab = tab;
    }
</script>

<main>
<div class="tabs">
    <ul>
      <li class:active={activeTab === 'browser'}>
        <button on:click={() => handleTabClick('browser')}>Browser</button>
      </li>
      <li class:active={activeTab === 'editor'}>
        <button on:click={() => handleTabClick('editor')}>Editor</button>
      </li>
      <li class:active={activeTab === 'servers'}>
        <button on:click={() => handleTabClick('servers')}>Servers</button>
      </li>
    </ul>
  
    <div class="tab-content">
      {#if activeTab === 'browser'}
        <div>
          <p>this will be the browser</p>
          <div class="browser-content">
            <!--<lua-script>return dom.test()</lua-script>-->
            
          </div>
        </div>
      {:else if activeTab === 'editor'}
        <div>
          <p>this will be the editor</p>
        </div>
      {:else if activeTab === 'servers'}
        <div>
          <p>this will be the server list</p>
        </div>
      {/if}
    </div>
  </div>
  
  <style>
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
  </style>
</main>