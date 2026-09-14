# @microsoft/flipcard

Framework-agnostic `<flip-card>` Web Component for FlipCard — the first primitive in an adaptive, manifest schema-driven, composable UI system.

## Install

```sh
npm install @microsoft/flipcard
```

## Usage

```html
<script type="module">
  import '@microsoft/flipcard/auto';

  const card = document.querySelector('flip-card');
  card.schema = { id: 'demo', fields: ['title', 'body'] };
</script>

<flip-card category="teal" back-title="Manifest" front-title="Front content">
  <div>Front content</div>
</flip-card>
```

You can also pass the manifest as JSON with the `manifest` attribute/property; the component will render `manifest.schema` on the back face and use `manifest.title` as the back title unless `back-title` is set explicitly.

## License

MIT
