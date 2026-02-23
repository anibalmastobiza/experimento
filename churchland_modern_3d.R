#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(ggplot2)
  library(plotly)
  library(htmlwidgets)
})

set.seed(83)

rot_x <- function(a) {
  matrix(c(
    1, 0, 0,
    0, cos(a), -sin(a),
    0, sin(a), cos(a)
  ), nrow = 3, byrow = TRUE)
}

rot_y <- function(a) {
  matrix(c(
    cos(a), 0, sin(a),
    0, 1, 0,
    -sin(a), 0, cos(a)
  ), nrow = 3, byrow = TRUE)
}

rot_z <- function(a) {
  matrix(c(
    cos(a), -sin(a), 0,
    sin(a), cos(a), 0,
    0, 0, 1
  ), nrow = 3, byrow = TRUE)
}

make_cluster <- function(center, sd_axes, n, rot) {
  cloud <- cbind(
    rnorm(n, 0, sd_axes[1]),
    rnorm(n, 0, sd_axes[2]),
    rnorm(n, 0, sd_axes[3])
  )
  points <- cloud %*% t(rot) + matrix(center, nrow = n, ncol = 3, byrow = TRUE)
  points <- pmin(pmax(points, 0), 1)
  data.frame(x = points[, 1], y = points[, 2], z = points[, 3])
}

build_ellipsoid <- function(center, radii, rot, n_u = 36, n_v = 48) {
  u <- seq(0, pi, length.out = n_u)
  v <- seq(0, 2 * pi, length.out = n_v)

  x0 <- outer(sin(u), cos(v)) * radii[1]
  y0 <- outer(sin(u), sin(v)) * radii[2]
  z0 <- outer(cos(u), rep(1, length(v))) * radii[3]

  coords <- rbind(as.vector(x0), as.vector(y0), as.vector(z0))
  coords_rot <- rot %*% coords

  list(
    x = matrix(coords_rot[1, ], nrow = n_u, ncol = n_v) + center[1],
    y = matrix(coords_rot[2, ], nrow = n_u, ncol = n_v) + center[2],
    z = matrix(coords_rot[3, ], nrow = n_u, ncol = n_v) + center[3]
  )
}

mine_proto <- c(0.30, 0.66, 0.62)
rock_proto <- c(0.72, 0.37, 0.44)

mine_rot <- rot_z(0.22) %*% rot_y(-0.14)
rock_rot <- rot_z(-0.36) %*% rot_x(0.20)

mine_pts <- make_cluster(mine_proto, sd_axes = c(0.09, 0.07, 0.10), n = 160, rot = mine_rot)
rock_pts <- make_cluster(rock_proto, sd_axes = c(0.10, 0.08, 0.09), n = 160, rot = rock_rot)

mine_ell <- build_ellipsoid(mine_proto, radii = c(0.18, 0.12, 0.16), rot = mine_rot)
rock_ell <- build_ellipsoid(rock_proto, radii = c(0.19, 0.13, 0.14), rot = rock_rot)

plane <- data.frame(
  x = c(0.46, 0.63, 0.80, 0.58),
  y = c(0.05, 0.95, 0.95, 0.05),
  z = c(0.06, 0.16, 0.95, 0.84)
)

cube_vertices <- matrix(
  c(
    0, 0, 0,
    1, 0, 0,
    1, 1, 0,
    0, 1, 0,
    0, 0, 1,
    1, 0, 1,
    1, 1, 1,
    0, 1, 1
  ),
  byrow = TRUE,
  ncol = 3
)

cube_edges <- matrix(
  c(
    1, 2,
    2, 3,
    3, 4,
    4, 1,
    5, 6,
    6, 7,
    7, 8,
    8, 5,
    1, 5,
    2, 6,
    3, 7,
    4, 8
  ),
  byrow = TRUE,
  ncol = 2
)

p <- plot_ly()

for (k in seq_len(nrow(cube_edges))) {
  i <- cube_edges[k, 1]
  j <- cube_edges[k, 2]
  p <- p |>
    add_trace(
      x = c(cube_vertices[i, 1], cube_vertices[j, 1]),
      y = c(cube_vertices[i, 2], cube_vertices[j, 2]),
      z = c(cube_vertices[i, 3], cube_vertices[j, 3]),
      type = "scatter3d",
      mode = "lines",
      line = list(color = "rgba(215,223,240,0.35)", width = 3),
      hoverinfo = "skip",
      showlegend = FALSE
    )
}

p <- p |>
  add_trace(
    x = plane$x,
    y = plane$y,
    z = plane$z,
    type = "mesh3d",
    i = c(0, 0),
    j = c(1, 2),
    k = c(2, 3),
    color = "#D5DBE8",
    opacity = 0.18,
    hoverinfo = "skip",
    showlegend = FALSE
  )

p <- suppressWarnings(
  p |>
  add_surface(
    x = mine_ell$x,
    y = mine_ell$y,
    z = mine_ell$z,
    surfacecolor = matrix(1, nrow = nrow(mine_ell$x), ncol = ncol(mine_ell$x)),
    colorscale = list(c(0, "#57E3D4"), c(1, "#57E3D4")),
    opacity = 0.16,
    showscale = FALSE,
    hoverinfo = "skip",
    showlegend = FALSE
  ) |>
  add_surface(
    x = rock_ell$x,
    y = rock_ell$y,
    z = rock_ell$z,
    surfacecolor = matrix(1, nrow = nrow(rock_ell$x), ncol = ncol(rock_ell$x)),
    colorscale = list(c(0, "#FF9A66"), c(1, "#FF9A66")),
    opacity = 0.16,
    showscale = FALSE,
    hoverinfo = "skip",
    showlegend = FALSE
  )
)

p <- p |>
  add_markers(
    data = mine_pts,
    x = ~x,
    y = ~y,
    z = ~z,
    marker = list(size = 3.1, color = "#57E3D4", opacity = 0.62),
    hoverinfo = "skip",
    showlegend = FALSE
  ) |>
  add_markers(
    data = rock_pts,
    x = ~x,
    y = ~y,
    z = ~z,
    marker = list(size = 3.1, color = "#FF9A66", opacity = 0.62),
    hoverinfo = "skip",
    showlegend = FALSE
  ) |>
  add_trace(
    x = mine_proto[1],
    y = mine_proto[2],
    z = mine_proto[3],
    type = "scatter3d",
    mode = "markers",
    marker = list(size = 12, color = "#F8FBFF", line = list(color = "#57E3D4", width = 5)),
    hovertemplate = "Mine-like prototype<extra></extra>",
    showlegend = FALSE
  ) |>
  add_trace(
    x = rock_proto[1],
    y = rock_proto[2],
    z = rock_proto[3],
    type = "scatter3d",
    mode = "markers",
    marker = list(size = 12, color = "#F8FBFF", line = list(color = "#FF9A66", width = 5)),
    hovertemplate = "Rock-like prototype<extra></extra>",
    showlegend = FALSE
  )

p <- p |>
  layout(
    title = list(
      text = "Neural State Space (3D)<br><sup>Inspired by Churchland (1995)</sup>",
      x = 0.02,
      font = list(color = "#EEF2FF", size = 23)
    ),
    showlegend = FALSE,
    paper_bgcolor = "#0E1320",
    plot_bgcolor = "#0E1320",
    margin = list(l = 5, r = 5, b = 5, t = 85),
    scene = list(
      bgcolor = "#0E1320",
      aspectmode = "cube",
      camera = list(eye = list(x = 1.55, y = 1.35, z = 1.05)),
      xaxis = list(
        title = "Middle-layer cell #1",
        range = c(0, 1),
        showbackground = FALSE,
        showgrid = FALSE,
        zeroline = FALSE,
        color = "#C9D1E5",
        tickvals = c(0, 0.5, 1)
      ),
      yaxis = list(
        title = "Middle-layer cell #2",
        range = c(0, 1),
        showbackground = FALSE,
        showgrid = FALSE,
        zeroline = FALSE,
        color = "#C9D1E5",
        tickvals = c(0, 0.5, 1)
      ),
      zaxis = list(
        title = "Middle-layer cell #3",
        range = c(0, 1),
        showbackground = FALSE,
        showgrid = FALSE,
        zeroline = FALSE,
        color = "#C9D1E5",
        tickvals = c(0, 0.5, 1)
      ),
      annotations = list(
        list(
          x = 0.16, y = 0.83, z = 0.88,
          text = "Mine-like region",
          showarrow = FALSE,
          font = list(color = "#9EF5EC", size = 12)
        ),
        list(
          x = 0.78, y = 0.57, z = 0.71,
          text = "Rock-like region",
          showarrow = FALSE,
          font = list(color = "#FFC29F", size = 12)
        ),
        list(
          x = 0.57, y = 0.93, z = 0.97,
          text = "Decision manifold",
          showarrow = FALSE,
          font = list(color = "#D9DFEE", size = 11)
        )
      )
    )
  )

dir.create("outputs", showWarnings = FALSE)
outfile <- "outputs/churchland_1995_modern_3d.html"
suppressWarnings(
  htmlwidgets::saveWidget(p, file = outfile, selfcontained = FALSE)
)

# Static 3D-style PNG export (no WebGL dependency)
project_points <- function(df, theta = 0.95, phi = 0.62, gamma = -0.25, zoom = 1.75, persp = 0.80) {
  centered <- as.matrix(df[, c("x", "y", "z")]) - matrix(c(0.5, 0.5, 0.5), nrow = nrow(df), ncol = 3, byrow = TRUE)
  rot <- rot_z(theta) %*% rot_x(phi) %*% rot_y(gamma)
  rotated <- centered %*% t(rot)
  depth <- 2.3 + rotated[, 3] * persp
  extras <- df[, setdiff(names(df), c("x", "y", "z")), drop = FALSE]

  cbind(
    data.frame(
      u = rotated[, 1] / depth * zoom,
      v = rotated[, 2] / depth * zoom,
      d = depth,
      x = df$x,
      y = df$y,
      z = df$z
    ),
    extras
  )
}

edge_df <- do.call(
  rbind,
  lapply(seq_len(nrow(cube_edges)), function(i) {
    a <- cube_edges[i, 1]
    b <- cube_edges[i, 2]
    data.frame(
      edge = i,
      x = c(cube_vertices[a, 1], cube_vertices[b, 1]),
      y = c(cube_vertices[a, 2], cube_vertices[b, 2]),
      z = c(cube_vertices[a, 3], cube_vertices[b, 3])
    )
  })
)

proj_edges <- project_points(edge_df)
proj_plane <- project_points(plane)

mine_ell_df <- data.frame(
  x = as.vector(mine_ell$x),
  y = as.vector(mine_ell$y),
  z = as.vector(mine_ell$z)
)
rock_ell_df <- data.frame(
  x = as.vector(rock_ell$x),
  y = as.vector(rock_ell$y),
  z = as.vector(rock_ell$z)
)

mine_hull <- {
  tmp <- project_points(mine_ell_df)
  tmp[chull(tmp$u, tmp$v), ]
}
rock_hull <- {
  tmp <- project_points(rock_ell_df)
  tmp[chull(tmp$u, tmp$v), ]
}

mine_proj <- project_points(mine_pts)
rock_proj <- project_points(rock_pts)
mine_proto_proj <- project_points(data.frame(x = mine_proto[1], y = mine_proto[2], z = mine_proto[3]))
rock_proto_proj <- project_points(data.frame(x = rock_proto[1], y = rock_proto[2], z = rock_proto[3]))

axes <- rbind(
  data.frame(axis = "x", x = 0, y = 0, z = 0),
  data.frame(axis = "x", x = 1, y = 0, z = 0),
  data.frame(axis = "y", x = 0, y = 0, z = 0),
  data.frame(axis = "y", x = 0, y = 1, z = 0),
  data.frame(axis = "z", x = 0, y = 0, z = 0),
  data.frame(axis = "z", x = 0, y = 0, z = 1)
)
proj_axes <- project_points(axes)
axis_lines <- do.call(
  rbind,
  lapply(c("x", "y", "z"), function(a) {
    pts <- proj_axes[proj_axes$axis == a, ]
    data.frame(axis = a, u = pts$u, v = pts$v)
  })
)

all_u <- c(
  proj_edges$u, proj_plane$u, mine_hull$u, rock_hull$u,
  mine_proj$u, rock_proj$u, mine_proto_proj$u, rock_proto_proj$u,
  axis_lines$u
)
all_v <- c(
  proj_edges$v, proj_plane$v, mine_hull$v, rock_hull$v,
  mine_proj$v, rock_proj$v, mine_proto_proj$v, rock_proto_proj$v,
  axis_lines$v
)
u_limits <- c(min(all_u) - 0.10, max(all_u) + 0.10)
v_limits <- c(min(all_v) - 0.10, max(all_v) + 0.10)

p_static <- ggplot() +
  geom_polygon(
    data = proj_plane,
    aes(u, v),
    fill = "#E3E9F2",
    alpha = 0.38,
    color = NA
  ) +
  geom_polygon(
    data = mine_hull,
    aes(u, v),
    fill = "#BDF6F0",
    alpha = 0.42,
    color = "#45CFC2",
    linewidth = 0.7
  ) +
  geom_polygon(
    data = rock_hull,
    aes(u, v),
    fill = "#FFE0C8",
    alpha = 0.42,
    color = "#F3A26D",
    linewidth = 0.7
  ) +
  geom_point(
    data = mine_proj,
    aes(u, v),
    size = 1.65,
    alpha = 0.66,
    color = "#53CDBF"
  ) +
  geom_point(
    data = rock_proj,
    aes(u, v),
    size = 1.65,
    alpha = 0.66,
    color = "#F4A26C"
  ) +
  geom_path(
    data = proj_edges,
    aes(u, v, group = edge),
    color = "#9AA5B57A",
    linewidth = 0.65,
    lineend = "round"
  ) +
  geom_path(
    data = axis_lines,
    aes(u, v, group = axis),
    color = "#9CA7B7",
    linewidth = 0.85
  ) +
  geom_point(
    data = mine_proto_proj,
    aes(u, v),
    size = 7.2,
    shape = 21,
    fill = "#FFFFFF",
    color = "#45CFC2",
    stroke = 1.65
  ) +
  geom_point(
    data = rock_proto_proj,
    aes(u, v),
    size = 7.2,
    shape = 21,
    fill = "#FFFFFF",
    color = "#F3A26D",
    stroke = 1.65
  ) +
  coord_equal(xlim = u_limits, ylim = v_limits, expand = FALSE, clip = "off") +
  theme_void(base_size = 14) +
  theme(
    plot.background = element_rect(fill = "#FFFFFF", color = NA),
    panel.background = element_rect(fill = "#FFFFFF", color = NA),
    plot.margin = margin(15, 15, 15, 15)
  )

png_file <- "outputs/churchland_1995_modern_3d.png"
png_file_alt <- "outputs/churchland_1995_modern_3d_static.png"
ggsave(
  filename = png_file,
  plot = p_static,
  width = 12,
  height = 7.4,
  dpi = 360,
  bg = "#FFFFFF"
)
invisible(file.copy(png_file, png_file_alt, overwrite = TRUE))

cat("3D visualization saved to", outfile, "\n")
cat("PNG export saved to", png_file, "\n")
