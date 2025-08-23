<script>
(function(){
  const root = document.documentElement;
  const saved = localStorage.getItem('theme') || 'light';
  root.setAttribute('data-theme', saved);

  const btn = document.getElementById('theme-toggle');
  if(btn){
    const setIcon = () => { btn.innerHTML = (root.getAttribute('data-theme')==='dark' ? '☀️' : '🌙'); };
    setIcon();
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      setIcon();
    });
  }
})();
</script>
