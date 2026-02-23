#!/usr/bin/env Rscript

# Visualizacion inspirada en Churchland (1995):
# cada patron de actividad se representa como un punto en un espacio neuronal.

suppressPackageStartupMessages({
  library(ggplot2)
})

set.seed(1995)

# Centros de activacion para distintos estimulos (3 neuronas de salida: X, Y, Z)
centros <- data.frame(
  estimulo = c("Cara A", "Cara B", "Cara C", "Objeto", "Palabra"),
  x = c(0.85, 0.65, 0.75, 0.30, 0.45),
  y = c(0.20, 0.45, 0.70, 0.75, 0.55),
  z = c(0.40, 0.70, 0.25, 0.60, 0.20)
)

n_repeticiones <- 60
sd_ruido <- 0.08

# Simulacion de ensayos alrededor de cada centro de activacion
sim <- do.call(
  rbind,
  lapply(seq_len(nrow(centros)), function(i) {
    data.frame(
      estimulo = centros$estimulo[i],
      neurona_x = pmin(pmax(rnorm(n_repeticiones, centros$x[i], sd_ruido), 0), 1),
      neurona_y = pmin(pmax(rnorm(n_repeticiones, centros$y[i], sd_ruido), 0), 1),
      neurona_z = pmin(pmax(rnorm(n_repeticiones, centros$z[i], sd_ruido), 0), 1)
    )
  })
)

centroides <- aggregate(cbind(neurona_x, neurona_y, neurona_z) ~ estimulo, sim, mean)

proyecciones <- rbind(
  data.frame(estimulo = sim$estimulo, plano = "X vs Y", a = sim$neurona_x, b = sim$neurona_y),
  data.frame(estimulo = sim$estimulo, plano = "X vs Z", a = sim$neurona_x, b = sim$neurona_z),
  data.frame(estimulo = sim$estimulo, plano = "Y vs Z", a = sim$neurona_y, b = sim$neurona_z)
)

centroides_proy <- rbind(
  data.frame(estimulo = centroides$estimulo, plano = "X vs Y", a = centroides$neurona_x, b = centroides$neurona_y),
  data.frame(estimulo = centroides$estimulo, plano = "X vs Z", a = centroides$neurona_x, b = centroides$neurona_z),
  data.frame(estimulo = centroides$estimulo, plano = "Y vs Z", a = centroides$neurona_y, b = centroides$neurona_z)
)

paleta <- c(
  "Cara A" = "#1b9e77",
  "Cara B" = "#d95f02",
  "Cara C" = "#7570b3",
  "Objeto" = "#66a61e",
  "Palabra" = "#e7298a"
)

p <- ggplot(proyecciones, aes(x = a, y = b, color = estimulo)) +
  geom_point(alpha = 0.55, size = 1.8) +
  stat_ellipse(level = 0.80, linewidth = 0.5, show.legend = FALSE) +
  geom_point(
    data = centroides_proy,
    aes(x = a, y = b),
    inherit.aes = FALSE,
    color = "black",
    fill = "white",
    shape = 21,
    stroke = 0.9,
    size = 2.6
  ) +
  facet_wrap(~plano, nrow = 1) +
  scale_color_manual(values = paleta) +
  coord_equal(xlim = c(0, 1), ylim = c(0, 1), expand = FALSE) +
  labs(
    title = "Espacio de activacion neuronal en 3 dimensiones",
    subtitle = "Cada punto es un patron de respuesta; cada estimulo ocupa una region del espacio de estados (Churchland, 1995).",
    x = "Activacion (0-1)",
    y = "Activacion (0-1)",
    color = "Estimulo"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    plot.title = element_text(face = "bold"),
    plot.background = element_rect(fill = "white", color = NA),
    panel.background = element_rect(fill = "white", color = NA),
    panel.grid.minor = element_blank(),
    legend.position = "bottom"
  )

dir.create("outputs", showWarnings = FALSE)
ggsave(
  filename = "outputs/churchland_1995_espacio_activacion_ggplot.png",
  plot = p,
  width = 12,
  height = 4.6,
  dpi = 320,
  bg = "white"
)

# Visualizacion 3D opcional si plotly y htmlwidgets estan instalados.
if (requireNamespace("plotly", quietly = TRUE) && requireNamespace("htmlwidgets", quietly = TRUE)) {
  p3d <- plotly::plot_ly(
    data = sim,
    x = ~neurona_x,
    y = ~neurona_y,
    z = ~neurona_z,
    color = ~estimulo,
    colors = paleta,
    type = "scatter3d",
    mode = "markers",
    marker = list(size = 3.2, opacity = 0.75)
  ) |>
    plotly::layout(
      title = list(text = "Espacio neuronal 3D (X, Y, Z)"),
      scene = list(
        xaxis = list(title = "Neurona X", range = c(0, 1)),
        yaxis = list(title = "Neurona Y", range = c(0, 1)),
        zaxis = list(title = "Neurona Z", range = c(0, 1))
      )
    )

  htmlwidgets::saveWidget(
    widget = p3d,
    file = "outputs/churchland_1995_espacio_activacion_3d.html",
    selfcontained = FALSE
  )
}

cat("Figura guardada en outputs/churchland_1995_espacio_activacion_ggplot.png\n")
if (file.exists("outputs/churchland_1995_espacio_activacion_3d.html")) {
  cat("Version 3D guardada en outputs/churchland_1995_espacio_activacion_3d.html\n")
}
