---
title: "Wazuh detection engineering lab"
summary: "A two-machine lab used to study how process execution events become Wazuh alerts, and to test rules against real audit data."
type: Laboratory
status: Ongoing
date: 2026-11-25
tools: [Wazuh 4.14.10, auditd, wazuh-logtest, VMware]
draft: false
---

## The problem

Monitoring every process execution is the raw material for detecting LOLBin abuse, but a naive rule on curl or a shell creates a steady stream of alerts that nobody can act on. The lab exists to find out where those alerts come from and how much context a rule needs.

## The environment

- A Wazuh manager virtual machine (version 4.14.10) that also runs the Wazuh indexer and dashboard. It has 1.5 GiB of RAM.
- One Ubuntu virtual machine running the Wazuh agent and auditd.
- Both machines run in VMware on a Windows host.

## The methodology

1. Record every `execve` call with an auditd rule and forward `/var/log/audit/audit.log` with the agent.
2. Read the raw events, then trace the repeated ones to their parent process.
3. Write rules in the custom range 100000 to 120000, check the syntax with `wazuh-analysisd -t`, and test with `wazuh-logtest`.
4. Repeat the test live on the endpoint and read the alerts on the manager and in the dashboard.

## The tools used

Wazuh 4.14.10, auditd, `wazuh-logtest`, `wazuh-analysisd`, `ausearch`, `systemd-run`, the Wazuh dashboard.

## The evidence collected

The full commands, outputs and nine screenshots are in the article [Detecting Linux LOLBins with Wazuh and auditd](/research/detecting-linux-lolbins-wazuh-auditd/).

## The findings

- The Wazuh log collector runs the configured `auditctl -l` command every 60 seconds through a shell, and these shells were a large share of all shell executions in the sample.
- Matching the executable path (`audit.exe`) is more reliable than matching the process name, because the process name can differ from the executable.
- The audit user ID (`auid`) and the terminal separate services from interactive sessions. A service started by systemd has an unset `auid`, a desktop helper started in a user session does not.
- A systemd user service in a restart loop produced a steady stream of informational alerts. It was found by reading the alert fields, not by guessing.

## Limitations

- One endpoint and a few harmless test commands. This is not a test against a real attack.
- The service account rule was tested with one account (`www-data`) started through `systemd-run`.
- The manager machine has little memory. The indexer failed to start at times, so dashboard results were sometimes delayed until it was restarted.

## What I learned

Read the fields of an alert before tuning a rule, and trace repeated alerts to their source. A rule that is correct but noisy is not finished.
