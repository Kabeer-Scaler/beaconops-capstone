{{- define "beaconops.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "beaconops.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name (include "beaconops.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "beaconops.labels" -}}
app.kubernetes.io/name: {{ include "beaconops.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | quote }}
{{- end }}

{{- define "beaconops.databaseUrl" -}}
{{- if .Values.externalDatabase.url -}}
{{ .Values.externalDatabase.url }}
{{- else -}}
postgresql+psycopg://{{ .Values.postgresql.username }}:{{ .Values.postgresql.password }}@{{ include "beaconops.fullname" . }}-postgresql:5432/{{ .Values.postgresql.database }}
{{- end -}}
{{- end }}
