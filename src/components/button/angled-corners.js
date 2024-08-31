if (typeof CSS !== 'undefined' && 'paintWorklet' in CSS) {
  CSS.paintWorklet.addModule(URL.createObjectURL(new Blob([`
    class BorderRadiusCut {
      static get inputProperties() {
        return [
          '--corner-radius',
          '--stroke-weight',
          '--stroke-color',
          '--paint-color'
        ];
      }

      static get inputArguments() {
        return [
          '<custom-ident>',
        ];
      }

      paint(ctx, geom, properties, args) {
        const radii = properties.get('--corner-radius').toString().replace(/px/g, '').split(' ').map(v => Math.max(0, parseInt(parseInt(v) * 0.6)));
        const inset = parseInt(properties.get('--stroke-weight')[0]) / 2 || 0;
        const strokeColor = properties.get('--stroke-color');
        const single = radii.length === 1;
        const radius1 = radii[0] | 0;
        const radius2 = (!single ? radii[1] : radius1) | 0;
        const radius3 = (!single ? radii[2] : radius1) | 0;
        const radius4 = (!single ? radii[3] : radius1) | 0;
        const height = Number(geom.height);
        ctx.fillStyle = properties.get('--paint-color');
        ctx.beginPath();
        ctx.moveTo(inset, radius1);
        ctx.lineTo(radius1, inset);
        ctx.lineTo(geom.width - radius2, inset);
        ctx.lineTo(geom.width - inset, radius2);
        ctx.lineTo(geom.width - inset, height - radius3);
        ctx.lineTo(geom.width - radius3, height - inset);
        ctx.lineTo(radius4, height - inset);
        ctx.lineTo(inset, height - radius4);
        ctx.closePath();
        ctx.lineTo(inset, radius1);

        if (strokeColor.length) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = properties.get('--stroke-weight');
          ctx.stroke();
        }

        ctx.fill();
      }
    }
    registerPaint('cut-corners', BorderRadiusCut);
  `], { type: "application/javascript" })));
}
