#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(ggplot2)
})

out_dir <- "/Users/anibalmonasterioastobiza/Documents/New project/outputs"
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

# Pilot data reconstructed from the presentation and proposal materials.
pilot <- data.frame(
  trial = factor(c("P1", "P2", "P3", "P4"), levels = c("P1", "P2", "P3", "P4")),
  condition = factor(c("Frontier", "Control", "Frontier", "Control"), levels = c("Frontier", "Control")),
  correct_informant = c("Robot", "Caregiver", "Robot", "Caregiver"),
  child_segment = c("New", "Same", "Same", "New"),
  seg_correct = c(TRUE, TRUE, FALSE, FALSE),
  pred_correct = c(TRUE, TRUE, FALSE, FALSE),
  chosen_informant = c("Robot", "Robot", "Caregiver", "Robot"),
  hesitation = c(TRUE, FALSE, FALSE, FALSE),
  half = factor(c("First", "First", "Second", "Second"), levels = c("First", "Second"))
)

pilot$robot_chosen <- pilot$chosen_informant == "Robot"

rate <- function(x) {
  if (length(x) == 0) return(NA_real_)
  mean(x)
}

summary_condition <- do.call(
  rbind,
  lapply(split(pilot, pilot$condition), function(df) {
    data.frame(
      condition = as.character(df$condition[1]),
      n_trials = nrow(df),
      segmentation_accuracy = rate(df$seg_correct),
      prediction_accuracy = rate(df$pred_correct),
      robot_choice_rate = rate(df$robot_chosen),
      hesitation_rate = rate(df$hesitation),
      stringsAsFactors = FALSE
    )
  })
)
summary_condition <- summary_condition[match(c("Frontier", "Control"), summary_condition$condition), ]

summary_half <- do.call(
  rbind,
  lapply(split(pilot, pilot$half), function(df) {
    data.frame(
      half = as.character(df$half[1]),
      n_trials = nrow(df),
      segmentation_accuracy = rate(df$seg_correct),
      prediction_accuracy = rate(df$pred_correct),
      robot_choice_rate = rate(df$robot_chosen),
      stringsAsFactors = FALSE
    )
  })
)
summary_half <- summary_half[match(c("First", "Second"), summary_half$half), ]

effects <- data.frame(
  metric = c("Delta deference (Frontier - Control)", "Overall robot choice"),
  value = c(
    summary_condition$robot_choice_rate[summary_condition$condition == "Frontier"] -
      summary_condition$robot_choice_rate[summary_condition$condition == "Control"],
    rate(pilot$robot_chosen)
  )
)

write.csv(pilot, file.path(out_dir, "pilot_trial_level.csv"), row.names = FALSE)
write.csv(summary_condition, file.path(out_dir, "pilot_summary_by_condition.csv"), row.names = FALSE)
write.csv(summary_half, file.path(out_dir, "pilot_summary_by_half.csv"), row.names = FALSE)
write.csv(effects, file.path(out_dir, "pilot_effects.csv"), row.names = FALSE)

txt <- c(
  "Bluey pilot (N=1) descriptive analysis",
  "",
  sprintf("Robot choices: %d/%d (%.2f)", sum(pilot$robot_chosen), nrow(pilot), rate(pilot$robot_chosen)),
  sprintf(
    "Robot choice rate by condition: Frontier %.2f, Control %.2f",
    summary_condition$robot_choice_rate[summary_condition$condition == "Frontier"],
    summary_condition$robot_choice_rate[summary_condition$condition == "Control"]
  ),
  sprintf("Delta deference (Frontier - Control): %.2f", effects$value[effects$metric == "Delta deference (Frontier - Control)"]),
  sprintf(
    "Segmentation accuracy by half: First %.2f, Second %.2f",
    summary_half$segmentation_accuracy[summary_half$half == "First"],
    summary_half$segmentation_accuracy[summary_half$half == "Second"]
  ),
  sprintf(
    "Prediction accuracy by half: First %.2f, Second %.2f",
    summary_half$prediction_accuracy[summary_half$half == "First"],
    summary_half$prediction_accuracy[summary_half$half == "Second"]
  ),
  sprintf("Hesitation observed in %d/%d trials", sum(pilot$hesitation), nrow(pilot))
)
writeLines(txt, con = file.path(out_dir, "analysis_summary.txt"))

palette_cond <- c("Frontier" = "#f4a261", "Control" = "#2a9d8f")
palette_inf <- c("Robot" = "#457b9d", "Caregiver" = "#e76f51")

p1 <- ggplot(pilot, aes(x = trial, y = 1, color = condition)) +
  geom_segment(aes(x = trial, xend = trial, y = 0, yend = 1), linewidth = 1.1, alpha = 0.4) +
  geom_point(aes(shape = chosen_informant, fill = chosen_informant), size = 5, color = "black") +
  geom_text(
    aes(
      y = 0.12,
      label = paste0(
        ifelse(seg_correct, "Seg✓", "Segx"), " ",
        ifelse(pred_correct, "Pred✓", "Predx"),
        ifelse(hesitation, " Hes", "")
      )
    ),
    color = "black",
    size = 3.4,
    vjust = 1
  ) +
  scale_color_manual(values = palette_cond) +
  scale_fill_manual(values = palette_inf) +
  scale_shape_manual(values = c("Robot" = 24, "Caregiver" = 21)) +
  scale_y_continuous(NULL, breaks = NULL) +
  labs(
    title = "Trial-Level Pattern (Bluey Pilot, N=1)",
    subtitle = "Marker = chosen informant; labels show segmentation and prediction correctness",
    x = "Pause"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    legend.position = "bottom",
    panel.grid.major.y = element_blank(),
    panel.grid.minor = element_blank()
  )

ggsave(
  filename = file.path(out_dir, "figure_1_trial_pattern.png"),
  plot = p1,
  width = 10,
  height = 4.8,
  dpi = 220
)

metric_long <- rbind(
  data.frame(condition = summary_condition$condition, metric = "Segmentation accuracy", rate = summary_condition$segmentation_accuracy),
  data.frame(condition = summary_condition$condition, metric = "Prediction accuracy", rate = summary_condition$prediction_accuracy),
  data.frame(condition = summary_condition$condition, metric = "Robot choice rate", rate = summary_condition$robot_choice_rate)
)

p2 <- ggplot(metric_long, aes(x = condition, y = rate, fill = condition)) +
  geom_col(width = 0.62, color = "black", linewidth = 0.2) +
  facet_wrap(~metric, nrow = 1) +
  scale_fill_manual(values = palette_cond) +
  scale_y_continuous(limits = c(0, 1), breaks = seq(0, 1, 0.25)) +
  labs(
    title = "Condition-Level Outcomes",
    subtitle = "Counterbalanced informant accuracy (Robot correct in Frontier; Caregiver correct in Control)",
    x = NULL,
    y = "Proportion"
  ) +
  theme_minimal(base_size = 12) +
  theme(
    legend.position = "none",
    panel.grid.minor = element_blank(),
    strip.text = element_text(face = "bold")
  )

ggsave(
  filename = file.path(out_dir, "figure_2_condition_metrics.png"),
  plot = p2,
  width = 11,
  height = 4.6,
  dpi = 220
)

half_long <- rbind(
  data.frame(half = summary_half$half, metric = "Segmentation accuracy", rate = summary_half$segmentation_accuracy),
  data.frame(half = summary_half$half, metric = "Prediction accuracy", rate = summary_half$prediction_accuracy)
)

p3 <- ggplot(half_long, aes(x = half, y = rate, group = metric, color = metric)) +
  geom_line(linewidth = 1.1) +
  geom_point(size = 3.2) +
  scale_color_manual(values = c("Segmentation accuracy" = "#264653", "Prediction accuracy" = "#8d99ae")) +
  scale_y_continuous(limits = c(0, 1), breaks = seq(0, 1, 0.25)) +
  labs(
    title = "Temporal Drop Across the Session",
    subtitle = "Both segmentation and prediction moved from perfect (first half) to null (second half)",
    x = NULL,
    y = "Proportion"
  ) +
  theme_minimal(base_size = 12) +
  theme(panel.grid.minor = element_blank())

ggsave(
  filename = file.path(out_dir, "figure_3_temporal_drop.png"),
  plot = p3,
  width = 8,
  height = 4.8,
  dpi = 220
)

cat("Analysis complete. Outputs in:", out_dir, "\n")
