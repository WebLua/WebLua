<svelte:options tag="lua-script" />
<script>
  import { onMount } from 'svelte';
  import { initlua } from '../lib/lua';
  let result;
  onMount(() => {
    const tags = document.getElementsByTagName('lua-script')
    for (const tag of tags) {
      const code = tag.textContent.trim()
      result = initlua().parse(code).exec()
      //                                                                             console.log(JSON.stringify(result))
    }
  });
  //var result = this.result
</script>

<p>{result === undefined ? "" : result}</p>