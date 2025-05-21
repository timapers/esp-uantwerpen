import subprocess
from src.config import config_data


def send_contact_message(first_name, last_name, role, message):
    subject = first_name + " " + last_name + " sent a message from ESP"
    send_mail(config_data.get('contact-mail', 'max.vanhoucke@student.uantwerpen.be'), subject, message)


def send_mail(address, subject, message):
    """
    Sends a mail using the sendemail command configured on the UA servers

    :param address: the recipient's mail address
    :param subject: the mail subject
    :param message: the mail message
    :return: process return code
    """
    try:
        cmd = ['sendemail',
               '-f', 'noreply@uantwerpen.be',
               '-t', address,
               '-u', subject,
               '-o', 'message-content-type=html',
               '-o', 'tls=no',
               '-m', message,
               '-s', 'smtp.uantwerpen.be']
        print(address, message)
        return True
        # TODO: re-enable
        # proc = subprocess.Popen(cmd)
        # return proc.returncode == 0
    except:
        return False

