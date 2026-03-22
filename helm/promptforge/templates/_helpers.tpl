{{/*
Expand the full name of the release.
*/}}
{{- define "promptforge.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to all resources.
*/}}
{{- define "promptforge.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels used in matchLabels and pod template labels.
*/}}
{{- define "promptforge.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Build the full image reference from global values.
Usage: {{ include "promptforge.imageRef" (dict "root" . "imageName" "promptforge-auth-service") }}
*/}}
{{- define "promptforge.imageRef" -}}
{{- printf "%s/%s/%s:%s" .root.Values.global.imageRegistry .root.Values.global.imageOwner .imageName .root.Values.global.imageTag }}
{{- end }}
