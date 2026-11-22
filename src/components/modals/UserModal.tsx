import type { user_detail } from '@/types/user';
import colors from '@styles/colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import InformationField from '@/components/fields/InformationField';
import InformationPhoneField from '@/components/fields/InformationPhoneField';
import InformationTray from '@/components/fields/InformationTray';
import ModalFade from '@/components/modals/common/ModalFade';
import { useCertsQuery } from '@/remote/query';
import { getPaddedDateString } from '@/utility/dateHelper';

interface UserModalProps {
  user: user_detail;
  onCancel: () => void;
}

function UserModal({ user, onCancel }: UserModalProps) {
  const certQuery = useCertsQuery(user.id);
  const certs = certQuery.data;
  console.log('UserModal', certs);

  return (
    <ModalFade
      modalVisible={!!user}
      onCancel={onCancel}
      headerTitle={user.full_name}
    >
      <View style={styles.dataContainer}>
        <InformationTray
          title="Details"
          titleBarColor={colors.green}
        >
          <InformationField title="Name" value={user.full_name} />
          <InformationField title="Username" value={user.username} />
          <InformationField title="Status" value={user.status} />
          <InformationField title="Employee ID" value={user.employee_id} />
          {!!user.radio_number && (
            <InformationField title="Radio Number" value={user.radio_number} />
          )}
        </InformationTray>

        <InformationTray
          title="Contact"
          titleBarColor={colors.red}
        >
          {user.phone_numbers.map(phone => (
            <InformationPhoneField
              key={phone.id}
              title={phone.type}
              value={phone.number}
            />
          ))}
        </InformationTray>

        {!!certs?.length && (
          <InformationTray title="Certs" titleBarColor={colors.green}>
            {certs.map(cert => (
              <InformationField
                key={cert.id}
                title={cert.type_name + (cert.subtype_name ? `: ${cert.subtype_name}` : '')}
                value={(cert.expires_on ? `Expires: ${getPaddedDateString(cert.expires_on, true)}` : '')
                  + (cert.description ? ` ${cert.description}` : '')}
              />
            ))}
          </InformationTray>
        )}
      </View>
    </ModalFade>
  );
}

const styles = StyleSheet.create({
  dataContainer: {
    zIndex: 101,
    alignContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default UserModal;
